//var server_addr = 'http://w3voice.jp/~chihiro/time_test/bar/main.cgi';
var recorderjs_path = '../js/recorder.js';
var recorderjs_workerpath = '../js/recorderWorker.js';

// ユーザID, 問題番号
var user_name;
var question_cnt = 0;
// ユーザID, 問題番号

// Audio
var audio_context;
var recorder;
var analyser;
var filter;
var flagRecording = false;
// Audio

// Level meter
//var level_type = 1; //0:sp 1:db 2: 3: 4: 5
var lv_canvas;
var lv_ctx;
var lv_width;
var lv_heihgt;
var lv_fillcolor;
// Level meter

// Timer
//var timer_type = 0; // 0: block 1: bar
var timer_canvas;
var timer_ctx;
var timer_width;
var timer_height;
var timer_cnt;
// Timer
  
// 画面出力用
function __output(e, data) {
    output.innerHTML = "" + e + " " + (data || '');
}
function __log(e, data) {
    log.innerHTML = "" + e + " " + (data || '');
}
function __answer_choices(e, data) {
    answer_choices.innerHTML = "" + e + " " + (data || '');
}
// 画面出力用

// [次の問題]ボタン
function goNext() {
    document.getElementById("nextButton").disabled = true;
    __log('問題を表示します。');

    question_cnt++;
    getNext(user_name, question_cnt);
}
function getNext(id, cnt) {
    var fd = new FormData();
    fd.append("id", id);
    fd.append("cnt", cnt);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", server_addr, false);
    xhr.onload = function(){ __output(xhr.responseText);}
    xhr.send(fd);                                
}
// [次の問題]ボタン

// 問題の再生の終了確認
function checkPlay() {
    __log('再生が終わるまでお待ちください。');
    document.getElementById("play").addEventListener("ended", function(){
	    // answer_choicesを取得
	    getAnswerChoices(user_name, question_cnt);
	    // 再生終了したら録音
	    startRecording();
	});
}
function getAnswerChoices(id, cnt) {
    if(document.getElementById("answer_choices") != null){
	var fd = new FormData();
	fd.append("id", id);
	fd.append("cnt", cnt);
	fd.append("ans", cnt);
	var xhr = new XMLHttpRequest();
	xhr.open("POST", server_addr, false);
	xhr.onload = function(){ __answer_choices(xhr.responseText);}
	xhr.send(fd);                                
    }
}
// 問題の再生の終了確認

// 解答（録音）中
function startRecording() {
    initialTimer();
    setTimer();
    recorder && recorder.record();
    __log('時間内に解答してください。');
    
    flagRecording = true;
}
// 解答（録音）中

// Level meter 描画(Loop)
function loopLevelMeter(){
    //背景描画
    lv_ctx.fillStyle = "#efefef";
    lv_ctx.fillRect(0, 0, lv_width, lv_height);
    
    //符号なし8bitArrayを生成
    var AudioData = new Uint8Array(analyser.frequencyBinCount);
    //周波数データ
    analyser.getByteFrequencyData(AudioData);
    
    if(flagRecording == true){
    	lv_ctx.fillStyle = "#000"//lv_fillcolor;
    } else{
	lv_ctx.fillStyle = "#ccc";
    }

	// Level settings

	if(level_type == 0){ //spectrum
		//console.log("spectrum:"+lv_height);
		var AudioDataTotal = 0;
    	for(var i = 0; i < AudioData.length; i++) {
        	lv_ctx.fillRect(i*5, lv_height, 4, -AudioData[i] / 4);
        	//(x座標,y座標,横の長さ（右へ）,縦の長さ（下へ））上に凸の場合は-になる
        	AudioDataTotal += AudioData[i];
    	}	
    }else if(level_type == 1){ //decibel
    	//console.log("decibel:"+lv_height);
		var AudioDataTotal = 0;
    	for(var i = 0; i < AudioData.length; i++) {
        	lv_ctx.fillRect(0, lv_height, lv_width, -AudioData[i]);
        	//(x座標,y座標,横の長さ（右へ）,縦の長さ（下へ））上に凸の場合は-になる
        	AudioDataTotal += AudioData[i];
    	}	
    }    
	// Level settings
    
    //音量によって色を変更する
    //var AudioDataMean = AudioDataTotal / AudioData.length; 
    //if(AudioDataMean > 6){
    //	lv_fillcolor = "#d00";
    //}else if(AudioDataMean <4){
    //	lv_fillcolor = "#ff0";
    //}else{
  	//lv_fillcolor = "#7cfc00";
    //}

    requestAnimationFrame(loopLevelMeter);
}
// Level meter 描画(Loop)



// Timer settings
function setTimer(){
    if(timer_type){  // 1: bar
	set_draw_timer = setInterval("drawTimer()", 29);
    }else{  // 0: block
	set_draw_timer = setInterval("drawTimer()", 995);
    }

    set_finish = setTimeout("Finish()", 10000);
}
// Timer settings
  
// 解答終了、音声の送信
function Finish(){
    clearInterval(set_draw_timer);
    clearTimeout(set_finish);
  	
    __log('準備ができたら[次の問題]をクリックしてください。');	
  	
    recorder && recorder.stop();

    uploadDataAudio(user_name, question_cnt);
	    
    recorder.clear();
	    
    flagRecording = false;
    document.getElementById("nextButton").disabled = false;
}
// 解答終了、音声の送信

// Timer初期化
function initialTimer(){
    timer_cnt = 0;
    if(timer_type){  // 1: bar
	//背景描画
	timer_ctx.fillStyle = "#4169e1";
	timer_ctx.fillRect(0, 0, timer_width, timer_height);

    }else{  // 0: block
	//背景色
	timer_ctx.fillStyle = "#aabbcc";

	for(var i = 0; i <10; i++){
	    if(i % 2 ==0){
		timer_ctx.fillStyle = "#dddddd";
		timer_ctx.fillRect(20*i+i*5, 0, 20, timer_height);
	    } else {
		timer_ctx.fillStyle = "#dddddd";
		timer_ctx.fillRect(20*i+i*5, 0, 20, timer_height);

	    }
	}
    }
}
// Timer初期化

// Timer描画
function drawTimer(){
    if(timer_type){  // 1: bar
	timer_ctx.fillStyle = "#afeeee";
	timer_ctx.fillRect(1, 1, timer_cnt*1.6, timer_height-2);
	timer_cnt += 1;
	
	
	//タイムバーの右側描画
	timer_ctx.fillStyle = "#4169e1";
	timer_ctx.fillRect(timer_width-1, 0, 1, timer_height);

    }else{ // 0: block
	if(timer_cnt >= 0 && timer_cnt <= 4){
	    timer_ctx.fillStyle = "#32cd32";
	}else if(timer_cnt >= 8){
	    timer_ctx.fillStyle = "#dc143c";
	}else{
	    timer_ctx.fillStyle = "#ffd700";
	}
	timer_ctx.fillRect(timer_cnt*20+timer_cnt*5, 0, 20, timer_height);
	timer_cnt += 1;
    }
}
// Timer描画

// アップロード（回答の送付, Audio付）
function uploadDataAudio(id, cnt) {
    recorder && recorder.exportWAV(function(blob) {
	var fd = new FormData();
	fd.append("filename", blob);
	fd.append("id", id);
	fd.append("cnt", cnt);
	var xhr = new XMLHttpRequest();
	xhr.open("POST", server_addr, false);
	xhr.onload = function(){ __output(xhr.responseText);}
	xhr.send(fd);                                
    });
}
// アップロード（回答の送付, Audio付）


function startUserMedia(stream){
    var input = audio_context.createMediaStreamSource(stream);
    input.connect(filter);
    filter.connect(analyser);
    
    recorder = new Recorder(input,  { workerPath: recorderjs_workerpath });

    // マイクが有効になったら[次の問題]ボタンを有効にする
    document.getElementById("nextButton").disabled = false;
    __log('音声は入力できていますか?<br>準備ができたら、[次の問題]をクリックして開始してください。');

    loopLevelMeter(); 
}

//ページが読み込まれたら実行
window.onload = function init() {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = recorderjs_path;
    document.body.appendChild(s);

    document.getElementById("nextButton").disabled = true;

    //nameBox
    //while(user_name == null){   // || user_name ==""
    //	user_name = prompt("英数でIDを入力してください。");
    //}
    __log(user_name + ' さん、ようこそ!<br>最初にブラウザでマイクのアクセスを許可してください。');

    //Blobがサポートされているか否か（ページを開いたらすぐ
    if (window.Blob) {
	//__log('OK. Blob is supported.');
    } else {
	__log('お使いのブラウザがBlobをサポートしていません。');
    }

    try {
	window.AudioContext = window.AudioContext || 
	window.webkitAudioContext ||
	window.mozAudioContext ||
	window.oAudioContext ||
	window.msAudioContext;
					
	navigator.getUserMedia = navigator.getUserMedia || 
	navigator.webkitGetUserMedia || 
	navigator.mozGetUserMedia ||
	navigator.oAudioContext ||
	navigator.msAudioContext;
	  
	window.URL = window.URL || 
	window.webkitURL || 
	window.mozURL ||
	window.oURL ||
	window.msURL;
      
	audio_context = new AudioContext;
    } catch (e) {
	alert('お使いのブラウザがWebAudio APIをサポートしていません。');
    }
    
    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
	    __log('マイク入力を開始することができませんでした。' + e);
	});

    //Create the filter
    filter = audio_context.createBiquadFilter();
    filter.type= 0;
    filter.frequency.value = 440;
    analyser = audio_context.createAnalyser();   	
    analyser.fftSize = 1024;

    //Levelmeter用canvas
    lv_canvas = document.getElementById("level_meter");
    lv_ctx = lv_canvas.getContext("2d");
    lv_width = lv_canvas.width;
    lv_height = lv_canvas.height;

    //Timer用canvas
    timer_canvas = document.getElementById("timer");
    timer_ctx = timer_canvas.getContext("2d");
    timer_width = timer_canvas.width;
    timer_height = timer_canvas.height;
    // Timer描画
    initialTimer();

};
