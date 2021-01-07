# -*- coding: utf-8 -*-
import io
import copy
import socket
import struct
import threading
from PID import *
from Face import *
import numpy as np
from Thread import *
from PIL import Image
from Command import COMMAND as cmd

from flask import Flask, render_template, request, Response
from flask_socketio import SocketIO
# TODO: add expression recognition
# https://towardsdatascience.com/face-detection-recognition-and-emotion-detection-in-8-lines-of-code-b2ce32d4d5de
# or : stream image with web so I can use tf.js 
# https://stackoverflow.com/questions/49939859/flask-video-stream-using-opencv-images

class Client:
    def __init__(self):
        self.face = Face()
        self.pid=Incremental_PID(1,0,0.0025)
        self.tcp_flag=False
        self.video_flag=True
        self.ball_flag=False
        self.face_flag=False
        self.face_id = False
        self.image=''
    def turn_on_client(self,ip):
        self.client_socket1 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        print (ip)
        
        
    def clientServer(self):
        print("flask client app start")
        app = Flask(__name__,
            static_url_path='', 
            static_folder='public',
            template_folder='templates')
        #db = redis.StrictRedis('localhost', 6379, 0)
        socketio = SocketIO(app)
        @app.route('/')
        def main():
            return "hello robotdog3!"
            #return render_template('main.html', saved_models = saved_models, inp=selected_model)

        def gen():
            while True:
                ret, jpeg = self.image
                frame = jpeg.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
    
        @app.route('/stream')
        def video_feed():
            if self.image:
                return Response(gen(),
                                mimetype='multipart/x-mixed-replace; boundary=frame')
            else:
                return "no video available"
        
        @socketio.on('connect', namespace='/dd')
        def ws_conn():
            #c = db.incr('connected')
            print('connect')
            socketio.emit('msg', {'count': 4}, namespace='/dd')


        flaskThread = threading.Thread(socketio.run(app, "0.0.0.0", port=81))
        flaskThread.start()
    def turn_off_client(self):
        try:
            self.client_socket.shutdown(2)
            self.client_socket1.shutdown(2)
            self.client_socket.close()
            self.client_socket1.close()
        except Exception as e:
            print(e)
            
    def is_valid_image_4_bytes(self,buf): 
        bValid = True
        if buf[6:10] in (b'JFIF', b'Exif'):     
            if not buf.rstrip(b'\0\r\n').endswith(b'\xff\xd9'):
                bValid = False
        else:        
            try:  
                Image.open(io.BytesIO(buf)).verify() 
            except:  
                bValid = False
        return bValid
    def Looking_for_the_ball(self):
        MIN_RADIUS=10
        #red
        THRESHOLD_LOW = (0, 140, 140)
        THRESHOLD_HIGH = (5,255,255)

        img_filter = cv2.GaussianBlur(self.image.copy(), (3, 3), 0)
        img_filter = cv2.cvtColor(img_filter, cv2.COLOR_BGR2HSV)
        img_binary = cv2.inRange(img_filter.copy(), THRESHOLD_LOW, THRESHOLD_HIGH)
        img_binary = cv2.dilate(img_binary, None, iterations = 1)
        contours = cv2.findContours(img_binary.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[-2]
        center = None
        radius = 0
        if len(contours) > 0:
            c = max(contours, key=cv2.contourArea)
            ((x, y), radius) = cv2.minEnclosingCircle(c)
            M = cv2.moments(c)
            if M["m00"] > 0:
                center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
                if radius < MIN_RADIUS:
                    center = None
        if center != None:
            cv2.circle(self.image, center, int(radius), (0, 255, 0))
            D=round(2700/(2*radius))  #CM
            x=self.pid.PID_compute(center[0])
            d=self.pid.PID_compute(D)
            if radius>15:
                if d < 20:
                        command=cmd.CMD_MOVE_BACKWARD+"#"+self.move_speed+'\n'
                        self.send_data(command)
                        #print (command)
                elif d > 30:
                        command=cmd.CMD_MOVE_FORWARD+"#"+self.move_speed+'\n'
                        self.send_data(command)
                        #print (command)
                else:
                    if x < 70:
                        command=cmd.CMD_TURN_LEFT+"#"+self.move_speed+'\n'
                        self.send_data(command)
                        #print (command)
                    elif x>270:
                        command=cmd.CMD_TURN_RIGHT+"#"+self.move_speed+'\n'
                        self.send_data(command)
                        #print (command)
                    else:
                        command=cmd.CMD_MOVE_STOP+"#"+self.move_speed+'\n'
                        self.send_data(command)
                        #print (command)
        else:
            command=cmd.CMD_MOVE_STOP+"#"+self.move_speed+'\n'
            self.send_data(command)
            #print (command)
    def receiving_video(self,ip):
        #self.clientServer()
        stream_bytes = b' '
        try:
            self.client_socket.connect((ip, 8001))
            self.connection = self.client_socket.makefile('rb')
        except:
            #print ("command port connect failed")
            pass
        
        
        while True:
            try:
                stream_bytes= self.connection.read(4)
                leng=struct.unpack('<L', stream_bytes[:4])
                jpg=self.connection.read(leng[0])
                if self.is_valid_image_4_bytes(jpg):
                    if self.video_flag:
                        self.image = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                        if self.ball_flag and self.face_id==False:
                           self.Looking_for_the_ball()
                        elif self.face_flag and self.face_id==False:
                            self.face.face_detect(self.image)
                        self.video_flag=False
            except BaseException as e:
                print (e)
                break

    def send_data(self,data):
        if self.tcp_flag:
            try:
                self.client_socket1.send(data.encode('utf-8'))
            except Exception as e:
                print(e)
    def receive_data(self):
        data=""
        data=self.client_socket1.recv(1024).decode('utf-8')
        return data
 
if __name__ == '__main__':
    pass
