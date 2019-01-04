// goog.require('Matrix.Cells')
// goog.require('Matrix.Model')
// goog.require('Matrix.mxWeb')
// goog.require('Matrix.mxXHR')
// goog.require('Hiring.utility')

clg = console.log

// --- main ---------------------------------------

SimpleJXTagLine = () => p({style: {font_size:'18px',
      font_style:'italic',
      text_align:'center'}},
  "The simplicity of HTML. The power of HLL.")

captionedImage = (imageSrc, imageWidth, caption, color='black', captionWidth=200) =>
  div( {class: ['captionImage', 'fazer']},
    img( {style: `width:300px`,src: imageSrc}),
    span( {class: 'caption',
        style: {color: color,
          max_width: `${captionWidth}px`}},
      caption))

simplicityQ = [
  {author:"Newton",
    quote: "Nature is pleased with simplicity. ",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/GodfreyKneller-IsaacNewton-1689.jpg"},
  {author:"Dr.Seuss",
    quote: "Sometimes the questions are complicated and the answers are simple.",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/doctor_seuss.jpg"},
  {author:"Jobs",
    quote: "Focus and simplicity can move mountains.",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/steve_jobs.jpg"},
  {author:"Kerouac",
    quote: "One day I will find the right words, and they will be simple.",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/kerouac.jpg"},
  {author:"Occam",
    quote: "It is vain to do with more what can be done with less.",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/William_of_Ockham.png"},
  {author:"Einstein",
    quote: "Make everything as simple as possible, but not simpler.",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/Albert-Einstein.jpg"},
  {author: "daVinci", quote: "Simplicity is the ultimate sophistication",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/daVinci.jpg"},
  {author: "Bruce", quote: "The extraordinary aspect of martial arts lies in its simplicity.",
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/BruceLee300.jpg"}
]

simplicityQShifter = (increment) => {
  /* to simplify things, we hard-wire a simplicity quote shifter */
  return i({class:'material-icons qShifter',
      onclick: (md)=> {
        carousel = md.fmUp('qCarousel')
        carousel.quoteNoRaw += increment // publish to quoteNo is transparent
      }
    },
    increment === -1 ? 'navigate_before' :'navigate_next')
}

function wrapAt( n, max) {
  let raw = (n % max)
  return raw < 0 ? raw + max : raw
}

/*
  Now let's look at refactoring, something that should be part
  of the TodoMVC Challenge, because UI development is more
  refactoring than creating.
*/

function mkQuoteIndex (n) {
  return span({
          class: cF( md => {
            currQNo = md.fmUp('qCarousel').quoteNo
            return ['qNo', currQNo == n ? 'qNoCurrent':null]}),
          onclick: md => {
            md.fmUp('qCarousel').quoteNoRaw = n}
        }, simplicityQ[n].author)
}

function QPlayButton () {
  return i({class: 'material-icons qPlayer',
            onclick: md => {
              qc = md.fmUp('qCarousel')
              qc.playing = !qc.playing
            },
            content: cF( c=> {
              console.log('running', c.md.fmUp('qCarousel').playing)
              return c.md.fmUp('qCarousel').playing ? 'pause' : 'play_arrow'
            })})
}

function CarouselControlBar () {
  return div({class: 'qControlBar'},
    simplicityQShifter(-1),
    [...simplicityQ.keys()].map( mkQuoteIndex),
    simplicityQShifter(1),
    QPlayButton())
}
function Carousel () {
  return div({class: "simplicityQCarousel"},
    {name: 'qCarousel',
      playing: cI( false),
      quoteNoRaw: cI(0),
      quoteNo: cF( c => wrapAt(c.md.quoteNoRaw, simplicityQ.length))},
    c => { return [CarouselControlBar(),
      div({class: 'qImage'},
        c=> {
          let cq = simplicityQ[ wrapAt(c.md.par.quoteNo, simplicityQ.length)]
          return captionedImage(cq.url, cq.width, cq.quote, 'white', 240)})]})
}

main = () => div({class: 'app'},
  h1({class: 'doctitle'},
    "SimpleJX&trade;"),
  SimpleJXTagLine(),
  Carousel())

document.onkeydown = function(e) {
  // focus (click) on the result panel to direct keyboard events there
  e = e || window.event;

  let appDom = document.getElementsByClassName('app')[0],
    app = dom2mx( appDom);

  let data = parseInt( e.key),
    sq = app.fmDown("qCarousel");

  if (isNaN( data)) {
    if (e.key==='ArrowRight') {
      ++sq.quoteNoRaw;
    } else if (e.key==='ArrowLeft') {
      --sq.quoteNoRaw;
    }
  }
};

function SimpleJXDemo () {
  return (main())
}

window['sjxMain'] = SimpleJXDemo;
