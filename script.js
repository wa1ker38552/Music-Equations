var currentOption = {
  "frequencies": null,
  "tempo": null,
  "iterations": null,
  "chords": null
}

const tips = [
  "You can change the indication variable in settings",
  "The default variable is 'x'",
  "A tempo below 100 might be malformed",
  "You can type in constants like 'e' and 'pi'",
  "Things like cos() and sqrt() work too!",
  "You can round numbers using round(x)"
]

// [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]
// 523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77
// const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77]
const base_octaves = [16.36, 18.35, 20.60, 21.83, 24.50, 27.50, 30.87]
var settingsModal
var running = false
var audioCtx
var notes = []

function toggleSettingsModal() {
  if (settingsModal.style.display == "none") {
    settingsModal.style.display = "grid"
  } else {
    settingsModal.style.display = "none"
  }
}

async function checkEquation() {
  running = false
  var result = document.getElementById("result")
  var e = document.getElementById("equation")
  var tempo = document.getElementById("tempo").value
  var iterations = document.getElementById("iterations").value
  var sequence = document.getElementById("sequence")
  var frequencies = document.getElementById("frequencies")
  var playButton = document.getElementById("playButton")
  var pauseButton = document.getElementById("pauseButton")
  var variable = document.getElementById("variable").value
  var octaves = document.getElementById("octaves").value.split(",")
  var chords = document.getElementById("chords").value

  for (var i=0; i<octaves.length; i++) {octaves[i] = parseInt(octaves[i])}
  
  notes = []
  const original = e.value
  var nums = []

  for (var i=octaves[0]; i<octaves[1]; i++) {
    for (note of base_octaves) {
      notes.push(note*Math.pow(2, i))
    }
  }

  if (notes.length == 0) {return}

  settingsModal.style.display = "none"
  document.getElementById("loading").style.display = "block"
  await new Promise(r => setTimeout(r, 10))
  
  if (isNaN(parseInt(iterations))) {
    result.innerHTML = `<span style="color: #ff5c5c">Invalid iterations value: ${iterations}</span>`
  } else {
    result.innerHTML = ""
    for (var i=0; i<parseInt(iterations); i++) {
      var equation = original
      while (equation.includes(variable)) {
        equation = equation.replace(variable, `(${i})`)
      }
      try {
        var value = math.evaluate(equation)
        if (value > 10000) {
          result.innerHTML += `<b>${Math.abs(Math.round(value%notes.length))}:</b> ${equation} = ${value.toExponential()}<br>`  
        } else {
          result.innerHTML += `<b>${Math.abs(Math.round(value%notes.length))}:</b> ${equation} = ${value}<br>`
        }
        nums.push(Math.abs(Math.round(value%notes.length)))
      } catch (e) {
        result.innerHTML = `<span style="color: #ff5c5c">${e}</span>`
      }
    }
  
    var freq = []
    for (n of nums) {
      freq.push(notes[n])
    }

    document.getElementById("loading").style.display = "none"
    sequence.innerHTML = nums.join(", ")

    frequencies.innerHTML = ""
    var i = 0
    for (f of freq) {
      var fe = document.createElement("span")
      fe.id = "f"+i
      fe.style.marginRight = "0.2em"
      fe.innerHTML = f
      frequencies.append(fe)
      i += 1
    }

    result.style.display = "block"

    if (!(result.innerHTML.includes("Error"))) {
      sequence.style.display = "block"
      frequencies.style.display = "block"
      playButton.style.display = "inline-block"
      pauseButton.style.display = "inline-block"

      currentOption.frequencies = freq
      currentOption.tempo = parseInt(tempo)
      currentOption.iterations = parseInt(iterations)
      currentOption.chords = parseInt(chords)
    }
  }
}

async function playNote(frequency, duration) {
  if (!(audioCtx)) {
    // Only create 1 audio context
    audioCtx = new(window.AudioContext || window.webkitAudioContext)()
  }
  var oscillator = audioCtx.createOscillator();

  oscillator.type = 'sine';
  try {
    oscillator.frequency.value = frequency; 
  } catch (e) {
    // Bad frequencies
    console.log(frequency)
  }
  oscillator.connect(audioCtx.destination);
  oscillator.start();

  await new Promise(r => setTimeout(r, duration));
  oscillator.stop()
}

async function playCurrent() {
  stopCurrent()
  running = true
  if (currentOption.chords > 1) {
    var i = 0
    var chords = []
    while (i < currentOption.frequencies.length) {
      var chord = []
      for (var j=0; j<currentOption.chords; j++) {
        if (i < currentOption.frequencies.length) {
          chord.push(currentOption.frequencies[i])
        }
        i += 1
      }
      chords.push(chord)
    }

    var c = 0
    for (chord of chords) {
      if (!running) {break}
      for (var i=0; i<chord.length; i++) {
        if (!running) {break}
        document.getElementById("f"+c).style.background = "#4dfe6b"
        document.getElementById("f"+c).scrollIntoView({ block: 'nearest', inline: 'center' })
        playNote(chord[i], currentOption.tempo)
        c += 1
      }
      await new Promise(r => setTimeout(r, currentOption.tempo))
    }
  } else {
    var i = 0;
    for (f of currentOption.frequencies) {
      if (running) {
        document.getElementById("f"+i).style.background = "#4dfe6b"
        document.getElementById("f"+i).scrollIntoView({ block: 'nearest', inline: 'center' })
        await playNote(f, currentOption.tempo)
        i += 1
      } else {
        break
      }
    }
  }
}

function stopCurrent() {
  running = false;
  for (e of document.getElementById("frequencies").children) {
    e.style.background = ""
  }

  document.getElementById("frequencies").children[0].scrollIntoView({ block: 'nearest', inline: 'center' })
}

window.onload = function() {
  settingsModal = document.getElementById("settingsModal")
  if (Math.floor(Math.random()*2) == 1) {
    document.getElementById("tip").innerHTML = '💡'+tips[Math.floor(Math.random()*tips.length)]
  }
}
