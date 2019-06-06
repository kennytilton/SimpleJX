(ns tiltontec.cell.core
  (:require

    [tiltontec.util.core :refer [rmap-setf]]
    ;#?(:clj [taoensso.tufte :as tufte :refer :all]
    ;   :cljs [taoensso.tufte :as tufte :refer-macros [defnp p profiled profile]])
    #?(:cljs [tiltontec.util.base
              :refer-macros [trx wtrx prog1 *trx?* def-rmap-slots def-rmap-meta-slots]]
       :clj [tiltontec.util.base :refer :all])

    #?(:clj [tiltontec.cell.base :refer :all :as cty]
       :cljs [tiltontec.cell.base
              :refer-macros [without-c-dependency]
              :refer [c-optimized-away? c-formula? c-value c-optimize
                      c-unbound? c-input? unbound
                      c-model mdead? c-valid? c-useds c-ref? md-ref?
                      c-state +pulse+ c-pulse-observed
                      *call-stack* *defer-changes*
                      c-rule c-me c-value-state c-callers caller-ensure
                      c-synapses
                      unlink-from-callers *causation*
                      c-synaptic? caller-drop
                      c-pulse c-pulse-last-changed c-ephemeral? c-slot
                      *depender* *not-to-be*
                      *c-prop-depth* md-slot-owning? c-lazy] :as cty])

    #?(:clj
    [tiltontec.cell.observer :refer :all]
       :cljs [tiltontec.cell.observer
              :refer-macros [fn-obs]
              :refer []])

    [#?(:cljs cljs.pprint :clj clojure.pprint) :refer [pprint cl-format]]
    #?(:clj
    [tiltontec.cell.integrity :refer :all]
       :cljs [tiltontec.cell.integrity
              :refer-macros [with-integrity]
              :refer []])
    [tiltontec.cell.evaluate :refer [c-get <cget c-value-assume
                                     record-dependency ensure-value-is-current]]))

;;#?(:cljs (set! *print-level* 3))

; todo: stand-alone cells with observers should be observed when they are made

(defn make-cell [& kvs]
  (let [options (apply hash-map kvs)]
    (#?(:clj ref :cljs atom) (merge {:value unbound
                                     ::cty/state :nascent
                                     :pulse 0
                                     :pulse-last-changed 0
                                     :pulse-observed 0
                                     :callers #{}
                                     :synapses #{}          ;; these stay around between evaluations
                                     ;; todo: if a rule branches away from a synapse
                                     ;;       it needs to be GCed so it starts fresh
                                     :lazy false            ;; not a predicate (can hold, inter alia, :until-asked)
                                     :ephemeral? false
                                     :input? true}

                              options)
         :meta {:type :tiltontec.cell.base/cell})))

(defn make-c-formula [& kvs]
  (let [options (apply hash-map kvs)
        rule (:rule options)]
    (assert rule)
    (assert (fn? rule))


    (#?(:clj ref :cljs atom) (merge {:value unbound
                                     ::cty/state :nascent   ;; s/b :unbound?
                                     :pulse 0
                                     :pulse-last-changed 0
                                     :pulse-observed 0
                                     :callers #{}
                                     :useds #{}
                                     :lazy false
                                     :ephemeral? false
                                     :optimize true         ;; this can also be :when-not-nil
                                     :input? false}         ;; not redundant: can start with rule, continue as input

                              options)
         :meta {:type :tiltontec.cell.base/c-formula})))

;;___________________ constructors _______________________________
;; I seem to have created a zillion of these, but I normally
;; use just cI, cF, and cFn (which starts out as cF and becomes cI).
;; 

(defmacro c-fn-var [[c] & body]
  `(fn [~c]
     (let [~'me (c-model ~c)
           ~'cell ~c
           ~'slot-name (c-slot ~c)
           ~'cache (c-value ~c)]
      ~@body)))

(defmacro c-fn [& body]
  `(c-fn-var (~'slot-c#) ~@body))

(defmacro cF [& body]
  `(make-c-formula
     :code '~body
     :value unbound
     :rule (c-fn ~@body)))

(defmacro cF+ [[& options] & body]
  `(make-c-formula
     ~@options
     :code '~body
     :value unbound
     :rule (c-fn ~@body)))

(defmacro cFn [& body]
  `(make-c-formula
     :code '(without-c-dependency ~@body)
     :input? true
     :value unbound
     :rule (c-fn (without-c-dependency ~@body))))

(defmacro cF+n [[& options] & body]
  `(make-c-formula
     ~@options
     :code '(without-c-dependency ~@body)
     :input? true
     :value unbound
     :rule (c-fn (without-c-dependency ~@body))))

(defmacro c_Fn [& body]
  `(make-c-formula
    :code '(without-c-dependency ~@body)
    :input? true
    :lazy :until-asked
    :value unbound
    :rule (c-fn (without-c-dependency ~@body))))

(defmacro cFn-dbg [& body]
  `(make-c-formula
    :code '(without-c-dependency ~@body)
    :input? true
    :debug true
    :value unbound
    :rule (c-fn (without-c-dependency ~@body))))

(defmacro cFn-until [args & body]
  `(make-c-formula
    :optimize :when-value-t
    :code '~body
    :input? true
    :value unbound
    :rule (c-fn ~@body)
    ~@args))

(defmacro cFonce [& body]
  `(make-c-formula
    :code '(without-c-dependency ~@body)
    :input? nil
    :value unbound
    :rule (c-fn (without-c-dependency ~@body))))

(defmacro c_1 [& body]
  `(make-c-formula
    :code '(without-c-dependency ~@body)
    :input? nil
    :lazy true
    :value unbound
    :rule (c-fn (without-c-dependency ~@body))))

(defmacro cF1 [& body]
  `(cFonce ~@body))

(defmacro cFdbg [& body]
  `(make-c-formula
    :code '~body
    :value unbound
    :debug true
    :rule (c-fn ~@body)))

(defmacro cF_  [[& options] & body]
  `(make-c-formula
    ~@options
    :code '~body
    :value unbound
    :lazy true
    :rule (c-fn ~@body)))

(defmacro c_F [[& options] & body]
  "Lazy until asked, then eagerly propagating"
  `(make-c-formula
    ~@options
    :code '~body
    :value unbound
    :lazy :until-asked
    :rule (c-fn ~@body)))

(defmacro c_Fdbg [& body]
  "Lazy until asked, then eagerly propagating"
  `(make-c-formula
    :code '~body
    :value unbound
    :lazy :until-asked
    :rule (c-fn ~@body)
    :debug true))

;; todo add validation somewhere of lazy option

(defmacro c-formula [[& kvs] & body]
  `(make-c-formula
    :code '~body                                            ;; debug aid
    :value unbound
    :rule (c-fn ~@body)
    ~@keys))

(defn cI [value & option-kvs]
  (apply make-cell
         :value value
         :input? true
         option-kvs))

;; --- where change and animation begin -------

(defn cset!> [c new-value]
  "The moral equivalent of a Common Lisp SETF, and indeed
in the CL version of Cells SETF itself is the change API dunction."
  (assert c)
  ;; (println :c-reset new-value)
  (cond
    *defer-changes*
    (do (println :c-reset-rejecting-undeferred! (c-slot c))
      #_ (throw (#?(:clj Exception. :cljs js/Error.)
       (cl-format t "c-reset!> change to ~s must be deferred by wrapping it in WITH-INTEGRITY"
                       (c-slot c)))))
    ;-----------------------------------
    (some #{(c-lazy c)} [:once-asked :always true])
    (c-value-assume c new-value nil)
    ;-------------------------------------------
    :else
    (do                                                     ;; tufte/p :wi-cvassume-sync
     (#?(:clj dosync :cljs do)
     (with-integrity (:change (c-slot c))
         (c-value-assume c new-value nil))))))

(defn c-reset! [c new-value]
  (cset!> c new-value))

(defn cswap!> [c swap-fn & swap-fn-args]
  (cset!> c (apply swap-fn (<cget c) swap-fn-args)))


(defmacro c-reset-next! [f-c f-new-value]
  "Observers should have side-effects only outside the
cell-mediated model, but it can be useful to have an observer
kick off further change to the model. To achieve this we
allow an observer to explicitly queue a c-reset! for 
execution as soon as the current change is manifested."
  `(cond
     (not *within-integrity*)
     (throw (#?(:clj Exception. :cljs js/Error.) "c-reset-next!> deferred change to %s not under WITH-INTEGRITY supervision."
                        (c-slot ~f-c)))
     ;---------------------------------------------
     :else
     (ufb-add :change
              [:c-reset-next!
               (fn [~'opcode ~'defer-info]
                 (let [c# ~f-c
                       new-value# ~f-new-value]
                   (call-c-reset-next! c# new-value#)))])))

(defmacro cset-next!>
  "Completely untested!!!!!!!!!!!!!!!"
  [f-c f-new-value]
  `(c-reset-next! ~f-c ~f-new-value))


(defn call-c-reset-next! [c new-value]
  (cond
    ;;-----------------------------------
    (some #{(c-lazy c)} [:once-asked :always true])
    (c-value-assume c new-value nil)
    ;;-------------------------------------------
    :else
    (#?(:cljs do :clj dosync)
     (c-value-assume c new-value nil))))


