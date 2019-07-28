// Constants
var FS = 44100; // Standard sampling rate for all problems

const fourier_expansion_level = 5; // expansion level for
                                   // square, sawtooth, triangle

/* 
 * RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
 * Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
 *
 * Public Domain
 *
 * Changelog:
 *
 * 0.01 - First release
 * 0.02 - New faster base64 encoding
 * 0.03 - Support for 16bit samples
 *
 * Notes:
 *
 * 8 bit data is unsigned: 0..255
 * 16 bit data is signed: −32,768..32,767
 *
 */

var FastBase64 = {
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    encLookup: [],
  
    Init: function() {
      for (var i = 0; i < 4096; i++) {
        this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3f]
      }
    },
  
    Encode: function(src) {
      var len = src.length
      var dst = ''
      var i = 0
      while (len > 2) {
        n = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2]
        dst += this.encLookup[n >> 12] + this.encLookup[n & 0xfff]
        len -= 3
        i += 3
      }
      if (len > 0) {
        var n1 = (src[i] & 0xfc) >> 2
        var n2 = (src[i] & 0x03) << 4
        if (len > 1) n2 |= (src[++i] & 0xf0) >> 4
        dst += this.chars[n1]
        dst += this.chars[n2]
        if (len == 2) {
          var n3 = (src[i++] & 0x0f) << 2
          n3 |= (src[i] & 0xc0) >> 6
          dst += this.chars[n3]
        }
        if (len == 1) dst += '='
        dst += '='
      }
      return dst
    } // end Encode
  }
  
  FastBase64.Init()
  
  var RIFFWAVE = function(data) {
    this.data = [] // Array containing audio samples
    this.wav = [] // Array containing the generated wave file
    this.dataURI = '' // http://en.wikipedia.org/wiki/Data_URI_scheme
  
    this.header = {
      // OFFS SIZE NOTES
      chunkId: [0x52, 0x49, 0x46, 0x46], // 0    4    "RIFF" = 0x52494646
      chunkSize: 0, // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
      format: [0x57, 0x41, 0x56, 0x45], // 8    4    "WAVE" = 0x57415645
      subChunk1Id: [0x66, 0x6d, 0x74, 0x20], // 12   4    "fmt " = 0x666d7420
      subChunk1Size: 16, // 16   4    16 for PCM
      audioFormat: 1, // 20   2    PCM = 1
      numChannels: 1, // 22   2    Mono = 1, Stereo = 2...
      sampleRate: 8000, // 24   4    8000, 44100...
      byteRate: 0, // 28   4    SampleRate*NumChannels*BitsPerSample/8
      blockAlign: 0, // 32   2    NumChannels*BitsPerSample/8
      bitsPerSample: 8, // 34   2    8 bits = 8, 16 bits = 16
      subChunk2Id: [0x64, 0x61, 0x74, 0x61], // 36   4    "data" = 0x64617461
      subChunk2Size: 0 // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    }
  
    function u32ToArray(i) {
      return [i & 0xff, (i >> 8) & 0xff, (i >> 16) & 0xff, (i >> 24) & 0xff]
    }
  
    function u16ToArray(i) {
      return [i & 0xff, (i >> 8) & 0xff]
    }
  
    function split16bitArray(data) {
      var r = []
      var j = 0
      var len = data.length
      for (var i = 0; i < len; i++) {
        r[j++] = data[i] & 0xff
        r[j++] = (data[i] >> 8) & 0xff
      }
      return r
    }
  
    this.Make = function(data) {
      if (data instanceof Array) this.data = data
      this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3
      this.header.byteRate = this.header.blockAlign * this.sampleRate
      this.header.subChunk2Size = this.data.length * (this.header.bitsPerSample >> 3)
      this.header.chunkSize = 36 + this.header.subChunk2Size
  
      this.wav = this.header.chunkId.concat(
        u32ToArray(this.header.chunkSize),
        this.header.format,
        this.header.subChunk1Id,
        u32ToArray(this.header.subChunk1Size),
        u16ToArray(this.header.audioFormat),
        u16ToArray(this.header.numChannels),
        u32ToArray(this.header.sampleRate),
        u32ToArray(this.header.byteRate),
        u16ToArray(this.header.blockAlign),
        u16ToArray(this.header.bitsPerSample),
        this.header.subChunk2Id,
        u32ToArray(this.header.subChunk2Size),
        this.header.bitsPerSample == 16 ? split16bitArray(this.data) : this.data
      )
      this.dataURI = 'data:audio/wav;base64,' + FastBase64.Encode(this.wav)
    }
  
    if (data instanceof Array) this.Make(data)
  } // end RIFFWAVE
  

// ---------------------------------------------
// Fast reimplementations of the list library
// ---------------------------------------------
function pair(x, y) {
    return f => f(x,y);
}

function head(p) {
    return p((x,y) => x);
}

function tail(p) {
    return p((x,y) => y);
}

// list.js: Supporting lists in the Scheme style, using pairs made
//          up of two-element JavaScript array (vector)

// Author: Martin Henz

'use strict'
// array test works differently for Rhino and
// the Firefox environment (especially Web Console)
function array_test(x) {
  if (Array.isArray === undefined) {
    return x instanceof Array
  } else {
    return Array.isArray(x)
  }
}

// pair constructs a pair using a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
function pair(x, xs) {
  return [x, xs]
}

// is_pair returns true iff arg is a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_pair(x) {
  return array_test(x) && x.length === 2
}

// head returns the first component of the given pair,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function head(xs) {
  if (is_pair(xs)) {
    return xs[0]
  } else {
    throw new Error('head(xs) expects a pair as argument xs, but encountered ' + xs)
  }
}

// tail returns the second component of the given pair
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function tail(xs) {
  if (is_pair(xs)) {
    return xs[1]
  } else {
    throw new Error('tail(xs) expects a pair as argument xs, but encountered ' + xs)
  }
}

// is_null returns true if arg is exactly null
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_null(xs) {
  return xs === null
}

// is_list recurses down the list and checks that it ends with the empty list []
// does not throw Value exceptions
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_list(xs) {
  for (; ; xs = tail(xs)) {
    if (is_null(xs)) {
      return true
    } else if (!is_pair(xs)) {
      return false
    }
  }
}

// list makes a list out of its arguments
// LOW-LEVEL FUNCTION, NOT SOURCE
function list() {
  let the_list = null
  for (let i = arguments.length - 1; i >= 0; i--) {
    the_list = pair(arguments[i], the_list)
  }
  return the_list
}

// list_to_vector returns vector that contains the elements of the argument list
// in the given order.
// list_to_vector throws an exception if the argument is not a list
// LOW-LEVEL FUNCTION, NOT SOURCE
function list_to_vector(lst) {
  const vector = []
  while (!is_null(lst)) {
    vector.push(head(lst))
    lst = tail(lst)
  }
  return vector
}

// vector_to_list returns a list that contains the elements of the argument vector
// in the given order.
// vector_to_list throws an exception if the argument is not a vector
// LOW-LEVEL FUNCTION, NOT SOURCE
function vector_to_list(vector) {
  let result = null
  for (let i = vector.length - 1; i >= 0; i = i - 1) {
    result = pair(vector[i], result)
  }
  return result
}

// returns the length of a given argument list
// throws an exception if the argument is not a list
function length(xs) {
  let i = 0
  while (!is_null(xs)) {
    i += 1
    xs = tail(xs)
  }
  return i
}

// map applies first arg f to the elements of the second argument,
// assumed to be a list.
// f is applied element-by-element:
// map(f,[1,[2,[]]]) results in [f(1),[f(2),[]]]
// map throws an exception if the second argument is not a list,
// and if the second argument is a non-empty list and the first
// argument is not a function.
// tslint:disable-next-line:ban-types
function map(f, xs) {
  return is_null(xs) ? null : pair(f(head(xs)), map(f, tail(xs)))
}

// build_list takes a non-negative integer n as first argument,
// and a function fun as second argument.
// build_list returns a list of n elements, that results from
// applying fun to the numbers from 0 to n-1.
// tslint:disable-next-line:ban-types
function build_list(n, fun) {
  if (typeof n !== 'number' || n < 0 || Math.floor(n) !== n) {
    throw new Error(
      'build_list(n, fun) expects a positive integer as ' + 'argument n, but encountered ' + n
    )
  }

  // tslint:disable-next-line:ban-types
  function build(i, alreadyBuilt) {
    if (i < 0) {
      return alreadyBuilt
    } else {
      return build(i - 1, pair(fun(i), alreadyBuilt))
    }
  }

  return build(n - 1, null)
}

// for_each applies first arg fun to the elements of the list passed as
// second argument. fun is applied element-by-element:
// for_each(fun,[1,[2,[]]]) results in the calls fun(1) and fun(2).
// for_each returns true.
// for_each throws an exception if the second argument is not a list,
// and if the second argument is a non-empty list and the
// first argument is not a function.
// tslint:disable-next-line:ban-types
function for_each(fun, xs) {
  if (!is_list(xs)) {
    throw new Error('for_each expects a list as argument xs, but encountered ' + xs)
  }
  for (; !is_null(xs); xs = tail(xs)) {
    fun(head(xs))
  }
  return true
}

// reverse reverses the argument list
// reverse throws an exception if the argument is not a list.
function reverse(xs) {
  if (!is_list(xs)) {
    throw new Error('reverse(xs) expects a list as argument xs, but encountered ' + xs)
  }
  let result = null
  for (; !is_null(xs); xs = tail(xs)) {
    result = pair(head(xs), result)
  }
  return result
}

// append first argument list and second argument list.
// In the result, the [] at the end of the first argument list
// is replaced by the second argument list
// append throws an exception if the first argument is not a list
function append(xs, ys) {
  if (is_null(xs)) {
    return ys
  } else {
    return pair(head(xs), append(tail(xs), ys))
  }
}

// member looks for a given first-argument element in a given
// second argument list. It returns the first postfix sublist
// that starts with the given element. It returns [] if the
// element does not occur in the list
function member(v, xs) {
  for (; !is_null(xs); xs = tail(xs)) {
    if (head(xs) === v) {
      return xs
    }
  }
  return null
}

// removes the first occurrence of a given first-argument element
// in a given second-argument list. Returns the original list
// if there is no occurrence.
function remove(v, xs) {
  if (is_null(xs)) {
    return null
  } else {
    if (v === head(xs)) {
      return tail(xs)
    } else {
      return pair(head(xs), remove(v, tail(xs)))
    }
  }
}

// Similar to remove. But removes all instances of v instead of just the first
function remove_all(v, xs) {
  if (is_null(xs)) {
    return null
  } else {
    if (v === head(xs)) {
      return remove_all(v, tail(xs))
    } else {
      return pair(head(xs), remove_all(v, tail(xs)))
    }
  }
}

// for backwards-compatibility
// equal computes the structural equality
// over its arguments
function equal(item1, item2) {
  if (is_pair(item1) && is_pair(item2)) {
    return equal(head(item1), head(item2)) && equal(tail(item1), tail(item2))
  } else {
    return item1 === item2
  }
}

// assoc treats the second argument as an association,
// a list of (index,value) pairs.
// assoc returns the first (index,value) pair whose
// index equal (using structural equality) to the given
// first argument v. Returns false if there is no such
// pair
function assoc(v, xs) {
  if (is_null(xs)) {
    return false
  } else if (equal(v, head(head(xs)))) {
    return head(xs)
  } else {
    return assoc(v, tail(xs))
  }
}

// filter returns the sublist of elements of given list xs
// for which the given predicate function returns true.
// tslint:disable-next-line:ban-types
function filter(pred, xs) {
  if (is_null(xs)) {
    return xs
  } else {
    if (pred(head(xs))) {
      return pair(head(xs), filter(pred, tail(xs)))
    } else {
      return filter(pred, tail(xs))
    }
  }
}

// enumerates numbers starting from start,
// using a step size of 1, until the number
// exceeds end.
function enum_list(start, end) {
  if (typeof start !== 'number') {
    throw new Error(
      'enum_list(start, end) expects a number as argument start, but encountered ' + start
    )
  }
  if (typeof end !== 'number') {
    throw new Error(
      'enum_list(start, end) expects a number as argument start, but encountered ' + end
    )
  }
  if (start > end) {
    return null
  } else {
    return pair(start, enum_list(start + 1, end))
  }
}

// Returns the item in list lst at index n (the first item is at position 0)
function list_ref(xs, n) {
  if (typeof n !== 'number' || n < 0 || Math.floor(n) !== n) {
    throw new Error(
      'list_ref(xs, n) expects a positive integer as argument n, but encountered ' + n
    )
  }
  for (; n > 0; --n) {
    xs = tail(xs)
  }
  return head(xs)
}

// accumulate applies given operation op to elements of a list
// in a right-to-left order, first apply op to the last element
// and an initial element, resulting in r1, then to the
// second-last element and r1, resulting in r2, etc, and finally
// to the first element and r_n-1, where n is the length of the
// list.
// accumulate(op,zero,list(1,2,3)) results in
// op(1, op(2, op(3, zero)))
function accumulate(op, initial, sequence) {
  if (is_null(sequence)) {
    return initial
  } else {
    return op(head(sequence), accumulate(op, initial, tail(sequence)))
  }
}

// set_head(xs,x) changes the head of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function set_head(xs, x) {
  if (is_pair(xs)) {
    xs[0] = x
    return undefined
  } else {
    throw new Error('set_head(xs,x) expects a pair as argument xs, but encountered ' + xs)
  }
}

// set_tail(xs,x) changes the tail of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function set_tail(xs, x) {
  if (is_pair(xs)) {
    xs[1] = x
    return undefined
  } else {
    throw new Error('set_tail(xs,x) expects a pair as argument xs, but encountered ' + xs)
  }
}

// ---------------------------------------------
// Low-level sound support
// ---------------------------------------------

// Samples a continuous wave to a discrete waves at sampling rate for duration
// in seconds
function discretize(wave, duration) {
    var vector = [];

    for (var i = 0; i < duration * FS; i++) {
        vector.push(wave( i / FS));
    }

    return vector;
}

// Discretizes a sound to a sound starting from elapsed_duration, for
// sample_length seconds
function discretize_from(wave, duration, elapsed_duration, sample_length, data) {
    if (elapsed_duration + sample_length > duration) {
        for (var i = elapsed_duration * FS; i < duration * FS; i++) {
            data[i - elapsed_duration * FS] = wave(i / FS);
        }
        return data;
    } else if (duration - elapsed_duration > 0) {
        for (var i = elapsed_duration * FS;
	     i < (elapsed_duration + sample_length) * FS;
	     i++) {
            data[i - elapsed_duration * FS] = wave(i / FS);
        }
        return data;
    }
}

// Quantize real amplitude values into standard 4-bit PCM levels
function quantize(data) {
    for (var i = 0; i < data.length; i++) {
        data[i] = Math.round((data[i] + 1) * 126);
    }
    return data;
}

// Try to eliminate clicks by smoothening out sudden jumps at the end of a wave
function simple_filter(data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i] > 1) {
          data[i] = 1;
        }
        if (data[i] < -1) {
          data[i] = -1;
        }
    }
    var old_value = 0;
    for (var i = 0; i < data.length; i++) {
        if (Math.abs(old_value - data[i]) > 0.01 && data[i] == 0) {
            data[i] = old_value * 0.999;
        }
        old_value = data[i];
    }
    return data;
}

function copy(data) {
    var ret = [];
    for (var i = 0; i < data.length; i++) {
        ret[i] = data[i];
    }
    return ret;
}

// Raw data to html5 audio element
function raw_to_audio(_data) {
    data = copy(_data);
    data = simple_filter(data);
    data = quantize(data);
    var riffwave = new RIFFWAVE();
    riffwave.header.sampleRate = FS;
    riffwave.header.numChannels = 1;
    riffwave.Make(data);
    var audio = new Audio(riffwave.dataURI);
    return audio;
}

// ---------------------------------------------
// Source API for Students
// ---------------------------------------------

// Data abstractions:
// time: real value in seconds  x > 0
// amplitude: real value -1 <= x <= 1
// duration: real value in seconds 0 < x < Infinity
// sound: (time -> amplitude) x duration

/**
 * Makes a sound from a wave and a duration.
 * The wave is a function from time (in seconds)
 * to an amplitude value that should lie between
 * -1 and 1. The duration is given in seconds.
 * @param {function} wave - given wave function
 * @param {number} duration - in seconds
 * @returns {sound} 
 */
function make_sound(wave, duration) {
    return pair(t => t >= duration ? 0 : wave(t), duration);
}

/**
 * Accesses the wave of a sound.
 * The wave is a function from time (in seconds)
 * to an amplitude value that should lie between
 * -1 and 1.
 * @param {sound} sound - given sound
 * @returns {function} wave function of the sound
 */
function get_wave(sound) {
    return head(sound);
}

/**
 * Accesses the duration of a sound, in seconds.
 * @param {sound} sound - given sound
 * @returns {number} duration in seconds
 */
function get_duration(sound) {
    return tail(sound);
}

/**
 * Checks if a given value is a sound
 * @param {value} x - given value
 * @returns {boolean} whether <CODE>x</CODE> is a sound
 */
function is_sound(x) {
    return is_pair(x) &&
    ((typeof get_wave(x)) === 'function') &&
    ((typeof get_duration(x)) === 'number');
}

// Keeps track of whether play() is currently running,
// and the current audio context.
var _playing = false;
var _player;

function play_unsafe(sound) {
    // type-check sound
    if ( !is_sound(sound) ) {
	throw new Error("play is expecting sound, but encountered " + sound);
    }	
    
    // Declaring duration and wave variables
    var wave = get_wave(sound);
    var duration = get_duration(sound);

    // If a sound is already playing, terminate execution
    if (_playing) {
	throw new Error("play: audio system still playing previous sound");
    }
    
    _playing = true;

    // Create AudioContext (test this out might fix safari issue)
    //const AudioContext = window.AudioContext || window.webkitAudioContext;
    
    // Main audio context
    _player = new AudioContext();

    // Controls Length of buffer in seconds.
    var buffer_length = 0.1;

    // Define Buffer Size
    var bufferSize = FS * buffer_length;

    // Create two buffers
    var buffer1 = _player.createBuffer(1, bufferSize, FS);
    var buffer2 = _player.createBuffer(1, bufferSize, FS);

    // Keep track of elapsed_duration & first run of ping_pong
    var elapsed_duration = 0;
    var first_run = true;

    // Schedules playback of sounds
    function ping_pong(current_sound, next_sound, current_buffer, next_buffer) {
        // If sound has exceeded duration, early return to stop calls.
        if (elapsed_duration > duration || !_playing) { 
            stop();
            return;
        }

        // Fill current_buffer, then play current_sound.
        if (first_run) {
            // No longer first run of ping_pong.
            first_run = false;

            // Discretize first chunk, load into current_buffer.
            let current_data = current_buffer.getChannelData(0);
            current_data = discretize_from(wave, duration, elapsed_duration,
					   buffer_length, current_data);

            // Create current_sound.
            current_sound = new AudioBufferSourceNode(_player);

            // Set current_sound's buffer to current_buffer.
            current_sound.buffer = current_buffer;

            // Play current_sound.
            current_sound.connect(_player.destination);
            current_sound.start();

            // Increment elapsed duration.
            elapsed_duration += buffer_length;
        }

        // Fill next_buffer while current_sound is playing,
	// schedule next_sound to play after current_sound terminates.

        // Discretize next chunk, load into next_buffer.
        let next_data = next_buffer.getChannelData(0);
        next_data = discretize_from(wave, duration, elapsed_duration,
				    buffer_length, next_data);

        // Create next_sound.
        next_sound = new AudioBufferSourceNode(_player);

        // Set next_sound's buffer to next_buffer.
        next_sound.buffer = next_buffer;

        // Schedule next_sound to play after current_sound.
        next_sound.connect(_player.destination);
        next_sound.start(start_time + elapsed_duration);

        // Increment elapsed duration.
        elapsed_duration += buffer_length;

        current_sound.onended =
	    event => 
            ping_pong(next_sound, current_sound, next_buffer, current_buffer);
    }
    var start_time = _player.currentTime;
    ping_pong(null, null, buffer1, buffer2);
    return sound;
}

// "Safe" playing for overly complex sounds.
// Discretizes full sound before playing
// (i.e. plays sound properly, but possibly with
// a delay).
var _safeplaying = false;
var _safeaudio = null;

/**
 * plays a given sound using your computer's sound device
 * @param {sound} sound - given sound
 * @returns {undefined} undefined
 */
function play(sound) {
    // If a sound is already playing, terminate execution.
    if (_safeplaying || _playing) return;
    // Discretize the input sound
    var data = discretize(get_wave(sound), get_duration(sound));
    _safeaudio = raw_to_audio(data);

    _safeaudio.addEventListener('ended', stop);
    _safeaudio.play();
    _safeplaying = true;
}

/* sound_to_string and string_to_sound would be really cool!!!

function sound_to_string(sound) {
    let discretized_wave = discretize(wave(sound), duration(sound));
    let discretized_sound = pair(discretized_wave, duration(sound));
    return stringify(pair(data), tail(sound));
}

function string_to_sound(str) {
    var discretized_sound = eval(str);
    
    return pair(t => ..., duration(data));
}
*/

/**
 * Stops playing the current sound
 * @returns {undefined} undefined
 */
function stop() {
    // If using normal play()
    if (_playing) {
        _player.close();
    }
    // If using play_safe()
    if (_safeplaying) {
        _safeaudio.pause();
        _safeaudio = null;
    }
    _playing = false;
    _safeplaying = false;
}

// Concats a list of sounds
/**
 * makes a new sound by combining the sounds in a given
 * list so that
 * they play consecutively, each next sound starting when the
 * previous sound ends
 * @param {list_of_sounds} sounds - given list of sounds
 * @returns {sound} resulting sound
 */
function consecutively(list_of_sounds) {
    function consec_two(ss1, ss2) {
        var wave1 = head(ss1);
        var wave2 = head(ss2);
        var dur1 = tail(ss1);
        var dur2 = tail(ss2);
        var new_wave = t => t < dur1 ? wave1(t) : wave2(t - dur1);
        return pair(new_wave, dur1 + dur2);
    }
    return accumulate(consec_two, silence_sound(0), list_of_sounds);
}

// Mushes a list of sounds together
/**
 * makes a new sound by combining the sounds in a given
 * list so that
 * they play simutaneously, all starting at the beginning of the 
 * resulting sound
 * @param {list_of_sounds} sounds - given list of sounds
 * @returns {sound} resulting sound
 */
function simultaneously(list_of_sounds) {
    function musher(ss1, ss2) {
        var wave1 = head(ss1);
        var wave2 = head(ss2);
        var dur1 = tail(ss1);
        var dur2 = tail(ss2);
        // new_wave assumes sound discipline (ie, wave(t) = 0 after t > dur)
        var new_wave = t => wave1(t) + wave2(t);
        // new_dur is higher of the two dur
        var new_dur = dur1 < dur2 ? dur2 : dur1;
        return pair(new_wave, new_dur);
    }

    var mushed_sounds = accumulate(musher, silence_sound(0), list_of_sounds);
    var normalised_wave =  t =>
	(head(mushed_sounds))(t) / length(list_of_sounds);
    var highest_duration = tail(mushed_sounds);
    return pair(normalised_wave, highest_duration);
}

/**
 * makes a sound of a given duration by randomly
 * generating amplitude values
 * @param {number} duration - duration of result sound, in seconds
 * @returns {sound} resulting noise sound
 */
function noise_sound(duration) {
    return make_sound(t => Math.random() * 2 - 1, duration);
}

/**
 * makes a sine wave sound with given frequency and a given duration
 * @param {number} freq - frequency of result sound, in Hz
 * @param {number} duration - duration of result sound, in seconds
 * @returns {sound} resulting sine sound
 */
function sine_sound(freq, duration) {
    return make_sound(t => Math.sin(2 * Math.PI * t * freq), duration);
}

/**
 * makes a silence sound with a given duration
 * @param {number} duration - duration of result sound, in seconds
 * @returns {sound} resulting silence sound
 */
function silence_sound(duration) {
    return make_sound(t => 0, duration);
}

// for mission 14

/**
 * converts a letter name <CODE>str</CODE> to corresponding midi note.
 * Examples for letter names are <CODE>"A5"</CODE>, <CODE>"B3"</CODE>, <CODE>"D#4"</CODE>.
 * See <a href="https://i.imgur.com/qGQgmYr.png">mapping from
 * letter name to midi notes</a>
 * @param {string} str - given letter name
 * @returns {number} midi value of the corresponding note
 */
function letter_name_to_midi_note(note) {
    // we don't consider double flat/ double sharp
    var note = note.split("");
    var res = 12; //MIDI notes for mysterious C0
    var n = note[0].toUpperCase();
    switch(n) {
        case 'D': 
            res = res + 2;
            break;

        case 'E': 
            res = res + 4;
            break;

        case 'F': 
            res = res + 5;
            break;

        case 'G': 
            res = res + 7;
            break;

        case 'A': 
            res = res + 9;
            break;

        case 'B': 
            res = res + 11;
            break;

        default :
            break;
    }

    if (note.length === 2) {
        res = parseInt(note[1]) * 12 + res;
    } else if (note.length === 3) {
        switch (note[1]) {
            case '#':
                res = res + 1;
                break;

            case 'b':
                res = res - 1;
                break;

            default:
                break;
        }
        res = parseInt(note[2]) * 12 + res;
    }

    return res;
}


/**
 * converts a letter name <CODE>str</CODE> to corresponding frequency.
 * First converts <CODE>str</CODE> to a note using <CODE>letter_name_to_midi_note</CODE>
 * and then to a frequency using <CODE>midi_note_to_frequency</CODE>
 * @param {string} str - given letter name
 * @returns {number} frequency of corresponding note in Hz
 */
function letter_name_to_frequency(note) {
    return midi_note_to_frequency(note_to_midi_note(note));
}

/**
 * converts a midi note <CODE>n</CODE> to corresponding frequency.
 * The note is given as an integer number.
 * @param {number} n - given midi note
 * @returns {number} frequency of the note in Hz
 */
function midi_note_to_frequency(note) {
    return 8.1757989156 * Math.pow(2, (note / 12));
}

/**
 * makes a square wave sound with given frequency and a given duration
 * @param {number} freq - frequency of result sound, in Hz
 * @param {number} duration - duration of result sound, in seconds
 * @returns {sound} resulting square sound
 */
function square_sound(freq, duration) {
    function fourier_expansion_square(t) {
        var answer = 0;
        for (var i = 1; i <= fourier_expansion_level; i++) {
            answer = answer +
		Math.sin(2 * Math.PI * (2 * i - 1) * freq * t)
		/
		(2 * i - 1);
        }
        return answer;
    }
    return make_sound(t => 
        (4 / Math.PI) * fourier_expansion_square(t),
        duration);
}

/**
 * makes a triangle wave sound with given frequency and a given duration
 * @param {number} freq - frequency of result sound, in Hz
 * @param {number} duration - duration of result sound, in seconds
 * @returns {sound} resulting triangle sound
 */
function triangle_sound(freq, duration) {
    function fourier_expansion_triangle(t) {
        var answer = 0;
        for (var i = 0; i < fourier_expansion_level; i++) {
            answer = answer +
		Math.pow(-1, i) *
		Math.sin((2 * i + 1) * t * freq * Math.PI * 2)
		/
		Math.pow((2 * i + 1), 2);
        }
        return answer;
    }
    return make_sound(t => 
        (8 / Math.PI / Math.PI) * fourier_expansion_triangle(t),
        duration);
}

/**
 * makes a sawtooth wave sound with given frequency and a given duration
 * @param {number} freq - frequency of result sound, in Hz
 * @param {number} duration - duration of result sound, in seconds
 * @returns {sound} resulting sawtooth sound
 */
function sawtooth_sound(freq, duration) {
    function fourier_expansion_sawtooth(t) {
        var answer = 0;
        for (var i = 1; i <= fourier_expansion_level; i++) {
            answer = answer + Math.sin(2 * Math.PI * i * freq * t) / i;
        }
        return answer;
    }
    return make_sound(t =>
		      (1 / 2) - (1 / Math.PI) * fourier_expansion_sawtooth(t),
		      duration);
}

play(sine_sound(700,1.5));