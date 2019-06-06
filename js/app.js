// goog.require('Matrix.Cells')
// goog.require('Matrix.Model')
// goog.require('Matrix.mxWeb')
// goog.require('Matrix.mxXHR')
// goog.require('Hiring.utility')

clg = console.log

main = () =>
  div({class: 'app'},
    div( {class: 'titlePanel'},
      h1({class: 'doctitle'}, "SimpleJX"),
      SimpleJXTagLine(),
      Credits({style: "font-size:12px; margin-top:0"},
        "Created by <a href='https://github.com/kennytilton'>Kenny Tilton</a>",
        "Maker of <a href='http://tiltontec.com'>Tilton's Algebra</a>")),
    QuoteCarousel())

QuoteCarousel = () =>
  div({class: "simplicityQCarousel"},
    {name: 'qCarousel',
      quoteNo: cI(0),
      playing: cI(false),
      ticker: cF( c => {
        if (c.md.playing) {
          return setInterval( () => { ++c.md.quoteNo }, 4000)
        } else if (typeof c.pv === "number") {
          clearInterval( c.pv)
          return null
        }})},
    QCarouselControlBar(),
    QImage())

fmQuoteNo = md => wrapAt( md.fmUp('qCarousel').quoteNo, simplicityQ.length)

QImage = () =>
  div( {class: ['captionImage']},
    { currentQ: cF( c => simplicityQ[ fmQuoteNo(c.md)])},
    c => [ img( {class: "qImage fazer",
      src: S3Root+c.md.currentQ.url}),
      span( {class: 'caption fazer'},
        c.md.currentQ.quote)])

QCarouselControlBar = () =>
  div({class: 'qControlBar'},
    div({class:'qSteppers'},
      QStepper(-1),
      QStepper(1)),
    div({class: 'qDirects'},
      [...simplicityQ.keys()].map( QDirectSelect)),
    QPlayButton('pause'))

QStepper = (increment) =>
  button({class:'material-icons stepper',
      disabled: cF( c => c.md.fmUp('qCarousel').playing),
      onclick: md => {
        let qc = md.fmUp('qCarousel')
        qc.playing = false
        clg('click', md, qc)
        qc.quoteNo += increment}},
    increment === -1 ?
      'navigate_before'
      :'navigate_next')

QDirectSelect = (n) =>
  span({class: cF( md => {
      return ['qNo', fmQuoteNo(md) == n ? 'qNoCurrent':null]}),
    onclick: md => {
      // stop the carousel if it is playing on auto, then set the quote
      qc = md.fmUp('qCarousel')
      qc.playing = false
      qc.quoteNo = n
    }}, simplicityQ[n].author)

QPlayButton = () =>
  i({class: 'material-icons qPlayer',
    onclick: md => {
      qc = md.fmUp('qCarousel')
      if (qc.playing)
        qc.playing = false
      else {
        qc.playing = true
      }
    },
    content: cF( c=> {
      return c.md.fmUp('qCarousel').playing ?
        'pause' : 'play_arrow'
    })})

SimpleJXTagLine = () =>
  p({class: 'tagline'},
    "The simplicity of HTML.<br>The power of HLL.<br>The magic of reactive.")

S3Root = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1590864/'

simplicityQ = [
  {author:"Einstein",
    quote: "Make everything as simple as possible,<br>but not simpler.",
    url: "Albert-Einstein.jpg"},
  {author:"Newton", quote: "Nature is pleased with simplicity. ",
    url: "GodfreyKneller-IsaacNewton-1689.jpg"},
  {author:"Kerouac", quote: "One day I will find the right words,<br>and they will be simple.",
    url: "kerouac.jpg"},
  {author:"Occam", quote: "It is vain to do with more<br>what can be done with less.",
    url: "William_of_Ockham.png"},
  {author: "daVinci", quote: "Simplicity is the ultimate sophistication",
    url: "daVinci.jpg"}
]

Credits = (attrs, ...content) =>
  footer(Object.assign({}, {class: "info"}, attrs),
    content.map( s => p({},s)));


function wrapAt( n, max) {
  let raw = (n % max)
  return raw < 0 ? raw + max : raw
}

keyChord = {
  ArrowRight: sq => ++sq.quoteNo,
  ArrowLeft: sq => --sq.quoteNo,
  ' ': sq => sq.playing = !sq.playing
};

document.onkeydown = function(e) {
  if (act = keyChord[(e || window.event).key]) {
    let appDom = document.getElementsByClassName("app")[0],
      app = dom2mx(appDom),
      sqx = app.fmDown("qCarousel");
    act(sqx);
  }
};


window['sjxMain'] = main;


