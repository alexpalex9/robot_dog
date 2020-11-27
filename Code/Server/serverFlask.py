# -*- coding: utf-8 -*-
"""
Created on Fri Nov 27 09:16:21 2020

@author: r392901
"""

#https://www.hackster.io/ruchir1674/video-streaming-on-flask-server-using-rpi-ef3d75

'''
# import required modules
from flask import Flask, render_template, Response 
import picamera 
import cv2
import socket 
import io 

app = Flask(__name__) 
vc = cv2.VideoCapture(0) 
@app.route('/') 
def index(): 
   """Video streaming .""" 
   return render_template('index.html') 
def gen(): 
   """Video streaming generator function.""" 
   while True: 
       rval, frame = vc.read() 
       cv2.imwrite('pic.jpg', frame) 
       yield (b'--frame\r\n' 
              b'Content-Type: image/jpeg\r\n\r\n' + open('pic.jpg', 'rb').read() + b'\r\n') 
@app.route('/video_feed') 
def video_feed(): 
   """Video streaming route. Put this in the src attribute of an img tag.""" 
   return Response(gen(), 
                   mimetype='multipart/x-mixed-replace; boundary=frame') 
if __name__ == '__main__': 
	app.run(host='0.0.0.0', debug=True, threaded=True) 
'''
#https://raspberrypi.stackexchange.com/questions/42759/streaming-raspberry-pi-camera-to-html-webpage-using-picamera-and-flask   
#!/usr/bin/env python
from flask import Flask, render_template, Response
from camera import Camera

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def gen(camera):
    while True:
        frame = camera.get_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen(Camera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)