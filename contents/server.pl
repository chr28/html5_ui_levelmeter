#!/usr/bin/perl -w
##
## Copyright (c) 2013, Ryuichi NISIMURA (nisimura@sys.wakayama-u.ac.jp)
## All rights reserved.
##
use strict;
use CGI;
use POSIX qw(strftime);

# 問題
my $question_dir = "../contents";
my @question_files = ('', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110'); #バー

## ブロックver.
## my @question_files = ('', '001', '002', '003', '004', '005', '006', '007', '008', '009', '010'); #ブロック

## バーver.
## my @question_files = ('', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110'); #バー


## Directory path to store .wav files
## This directory must be httpd user writable (www-admin, nobody, etc)
my $basedir = ".";
my $waveout_dir = "save";

## 'file' command path
my $file_cmd = "/usr/bin/file";

#############################################################

my $query = new CGI;
my $query_filehandle = $query->upload('filename');
my $query_id = $query->param('id');
my $query_cnt = $query->param('cnt');
my $query_ans = $query->param('ans');

# File ID
my $timestamp = strftime "%y%m%d%H%M%S", localtime;
my $clientip = $ENV{'REMOTE_ADDR'};
my $outfilename = "$query_id.$query_cnt.$timestamp.$clientip";
print STDERR "$0.$$: Access ($outfilename)\n";

my $errflag = 0;
my $outputmesg;
my $contents_file; 

# 音声データが有るとき
if($query_filehandle){
    print STDERR "$0.$$: uploadDataAudio ($outfilename)\n";
    my $mimetype = $query->uploadInfo($query_filehandle)->{'Content-Type'};
    # Check MIME Type of uploaded data
    if($mimetype ne "audio/wav"){
	$errflag = 1;
	print STDERR "$0.$$: Err Content-Type ($outfilename)\n";
    }

    if(!$query_id || !$query_cnt){
	$errflag = 1;
	print STDERR "$0.$$: Err query_id,query_cnt ($outfilename)\n";
    }

    my $waveout = "$basedir/$waveout_dir/$outfilename.wav";
    my $buffer;
    open(OUT, ">$waveout") || die "save error $!";
    while(read($query_filehandle, $buffer, 1024)){
	print OUT $buffer;
    }
    close(OUT);
    close($query_filehandle);
    print STDERR "$0.$$: Stored ($outfilename)\n";

    # Check the file
    my $type = `$file_cmd $waveout`;
    if ($type !~ /WAVE\s+audio/){
	$errflag = 1;
	print STDERR "$0.$$: Err UploadFile ($outfilename)\n";
    }

    if($errflag){
	$contents_file = "$question_dir/err.dat";
    }else{
	$contents_file = "$question_dir/done.dat";
    }

# 音声データが無いとき
}else{
    print STDERR "$0.$$: getNext ($outfilename)\n";
    if($query_ans){
	if($query_ans != $query_cnt){
	    $contents_file = "$question_dir/err.ans";
	}else{	    
	    $contents_file = "$question_dir/$question_files[$query_cnt].ans";
	}
    }else{
	$contents_file = "$question_dir/$question_files[$query_cnt].dat";
    }
}

# コンテンツファイルをロードします
print STDERR "$0.$$: Contents $contents_file ($outfilename)\n";
if(-f $contents_file){
    open(FILE, "$contents_file") || die "open error $!";
    while(<FILE>){
	$outputmesg .= $_;
    }
    close(FILE);
}else{
    $errflag = 1;
    $outputmesg = "エラー: コンテンツファイルが存在しません。";
    print STDERR "$0.$$: Err $contents_file ($outfilename)\n";
}

# エラーがあったときに情報を付与します
if($errflag){
    $outputmesg .= "<br>Err: $query_id, $query_cnt, $timestamp, $ENV{'REMOTE_ADDR'}";
}

# HTMLを出力します
print $query->header(-charset=>'utf-8');
print <<EOS;
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
$outputmesg
</body>
</html>
EOS
print STDERR "$0.$$: Done ($outfilename)\n";

1;
