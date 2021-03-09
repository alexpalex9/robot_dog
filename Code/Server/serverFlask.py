#!/usr/bin/env python

import sys
print(sys.argv)
from flask import Flask, render_template, Response, flash, request, redirect, url_for
from flask_socketio import SocketIO, send, emit
#from werkzeug.utils import secure_filename
import os
#import logging
#logging.getLogger('socketio').setLevel(logging.ERROR)
#logging.getLogger('SocketIO').setLevel(logging.ERROR)

UPLOAD_FOLDER = os.path.dirname(os.path.realpath(__file__)) + '/public/mymodels/'
#print(UPLOAD_FOLDER)
ALLOWED_EXTENSIONS = {'bin','json'}

import io
import time
import threading
import datetime
#FLASK_DEBUG=0

#if len(sys.argv)<3:
#    sys.argv.append(False)


if len(sys.argv)>=2:
    DEV = ((sys.argv[1]=='True') or (sys.argv[1]=='true') or (sys.argv[1]=='y') or (sys.argv[1]=='yes'))
else:
    DEV  = False
    
if len(sys.argv)>=3:
    CAM = ((sys.argv[2]=='True') or (sys.argv[2]=='true') or (sys.argv[2]=='y') or (sys.argv[2]=='yes'))
else:
    CAM = False


if DEV==False:
    import picamera
    from Led import *
    from Servo import *
    
    from Buzzer import *
    from Control import *
    from ADS7830 import *
    from Ultrasonic import *
else:
    print('/!\\ Developper mode')
    import random
    if CAM==True:
        import cv2
        localcamera = cv2.VideoCapture(0)
    else:
        print('/!\\ Camera disabled')
    
from Thread import *
from Command import COMMAND as cmd


PORT = 5002

class Camera(object):
    thread = None  # background thread that reads frames from camera
    frame = None  # current frame is stored here by background thread
    last_access = 0  # time of last client access to the camera

    def initialize(self):
        if Camera.thread is None:
            # start background frame thread
            Camera.thread = threading.Thread(target=self._thread)
            Camera.thread.start()

            # wait until frames start to be available
            while self.frame is None:
                time.sleep(0)

    def get_frame(self):
        Camera.last_access = time.time()
        self.initialize()
        return self.frame

    @classmethod
    def _thread(cls):
        with picamera.PiCamera() as camera:
            # camera setup
            #camera.resolution = (320, 240)
            #camera.resolution = (640, 480)
            camera.resolution = (640, 480)
            camera.framerate = 24
            #camera.hflip = True
            #camera.vflip = True

            # let camera warm up
            #camera.start_preview()
            #time.sleep(2)

            stream = io.BytesIO()
            for foo in camera.capture_continuous(stream, 'jpeg',
                                                 use_video_port=True):
                # store frame
                stream.seek(0)
                cls.frame = stream.read()

                # reset stream for next frame
                stream.seek(0)
                stream.truncate()

                # if there hasn't been any clients asking for frames in
                # the last 10 seconds stop the thread
                if time.time() - cls.last_access > 10:
                    break
        cls.thread = None
    
class Server():
    def __init__(self):
        self.tcp_flag=False
        
        if DEV==False:
            #self.led=Led()
            self.servo=Servo()
            self.adc=ADS7830()
            self.buzzer=Buzzer()
            self.control=Control()
            self.sonic=Ultrasonic()
            self.control.Thread_conditiona.start()
            self.battery_voltage=[8.4,8.4,8.4,8.4,8.4]
        else:
            self.devSonic = random.randrange(8, 52)
        app = Flask(__name__,
                    static_url_path='',
                    static_folder='public',
                    template_folder='view')
        
        app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
        
        SECRET_KEY = '\xfd{H\xe5<\x95\xf9\xe3\x96.5\xd1\x01O<!\xd5\xa2\xa0\x9fR"\xa1\xa8'
        app.config['SECRET_KEY'] = SECRET_KEY
        
        socketio = SocketIO(app)
        @app.route('/')
        def index():
            return render_template('index.html')
        
        def allowed_file(filename):
            return '.' in filename and \
                   filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
        
        @app.route('/mymodels', methods=['GET', 'POST'])
        def upload_file():
            #print("REQUEST",request.files)
            print("REQUEST",request.headers)
            for f in request.files:
                #print(os.path.join(app.config['UPLOAD_FOLDER'], request.headers['Prefix'] + f))
                #request.files[f].save(os.path.join(app.config['UPLOAD_FOLDER'], request.headers['Prefix'] + f))
                # https://github.com/fabianlee/python-flask-upload-files/blob/master/flask_upload_files.py
                request.files[f].save(app.config['UPLOAD_FOLDER'] +  request.headers['Prefix'] + f)
            return "done"
    
        @app.route('/learn')
        def learn():
            return render_template('learn.html')
        
        @app.route('/learn3')
        def learn3():
            return render_template('learn_v3.html')
        
        @app.route('/dqn')
        def dqn():
            return render_template('learn_dqn.html')

        @app.route('/tql')
        def tql():
            return render_template('learn_tql.html')
                
        def gen(camera=None):
            while True:
                if DEV==False:
                    frame = camera.get_frame()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                else:
                    success, image = localcamera.read()
                    ret, jpeg = cv2.imencode('.jpg', image)
                    frame = jpeg.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

        @app.route('/stream.mjpg')
        def video_feed():
            if DEV==False:
                return Response(gen(Camera()),
                                mimetype='multipart/x-mixed-replace; boundary=frame')
            else:
                if CAM==True:
                    return Response(gen(),
                                mimetype='multipart/x-mixed-replace; boundary=frame')
                else:
                    return 'dev'
            
        @socketio.on('connect', namespace='/robot')
        def ws_conn():
            print('connect')
        
        @socketio.on('disconnect', namespace='/robot')
        def ws_disconn():
            print('disconnect')
        
        @socketio.on('get state', namespace='/robot')
        def get_state():
            if DEV==False:
                #print("servo value";self.control.servo.values())
                emit('state',{
                    'servos':self.control.servo.values
                })
            else:
                emit('state',{
                    'servos':{
                        1 : 45,
                        2 : 10
                    }
                })
    
        socketio.on('git pull', namespace='/robot')
        def get_pull():
            import git 
            g = git.cmd.Git(os.path.dirname(os.path.realpath(__file__)))
            act = g.pull()
            emit('git pulled',act)
        @socketio.on('gyro', namespace='/robot')
        def get_gyro():
            print("Get Gyro")
            if DEV==False:
                x,y,z = self.control.getGyro()
            else:
                x,y,z = random.randrange(0, 20),random.randrange(0, 20),random.randrange(0, 20)
            emit('gyro',{
                'x':x,
                'y':y,
                'z':z
            })
            emit('gyro await',{
                'x':x,
                'y':y,
                'z':z
            })

        @socketio.on('set servos angle', namespace='/robot')
        def set_servos(data):
            print('set servos angle',data)
            for servo in data:
                if DEV==False:
                    #self.control.servo.setServoAngleSpeed(int(servo),data[servo],0.7)
                    self.control.servo.setServoAngle(int(servo),data[servo])
                else:
                    pass
            if DEV==False:
                time.sleep(0.5)
                emit('servos angle',self.control.servo.values)
                emit('servos angle await',self.control.servo.values)
            else:
                time.sleep(0.1)
                emit('servos angle',data)
                emit('servos angle await',data)
                
        @socketio.on('cmd', namespace='/robot')
        def ws_cmd(allData):
            cmdArray=allData #.split('\n')
            print(cmdArray)
            #if DEV==True:
            #    print("Dev, no cmd allowed")
            #    return
            
            if len(cmdArray)>0:
                if cmdArray[-1] !="":
                    cmdArray==cmdArray[:-1]
            for oneCmd in cmdArray:
                data = oneCmd.split("#")
                if data==None or data[0]=='':
                    continue
                elif cmd.CMD_BUZZER in data:
                    self.buzzer.run(data[1])
                elif cmd.CMD_LED in data:
                    try:
                        stop_thread(thread_led)
                    except:
                        pass
                    thread_led=threading.Thread(target=self.led.light,args=(data,))
                    thread_led.start()   
                elif cmd.CMD_LED_MOD in data:
                    try:
                        stop_thread(thread_led)
                    except:
                        pass
                    thread_led=threading.Thread(target=self.led.light,args=(data,))
                    thread_led.start()
                elif cmd.CMD_HEAD in data:
                    self.servo.setServoAngle(15,int(data[1]))
                elif cmd.CMD_SONIC in data:
                    #command = cmd.CMD_SONIC+'#'+str(self.sonic.getDistance())+"\n"
                    if DEV==False:
                        sonic = self.sonic.getDistance()
                    else:
                        sonic = random.randrange(self.devSonic-4, self.devSonic+4)
                    emit('sonic',sonic)
                    emit('sonic await',sonic)
                elif cmd.CMD_POWER in data:
                    self.measuring_voltage(self.connection1)
                elif cmd.CMD_WORKING_TIME in data: 
                    if self.control.move_timeout!=0 and self.control.relax_flag==True:
                        if self.control.move_count >180:
                            command=cmd.CMD_WORKING_TIME+'#'+str(180)+'#'+str(round(self.control.move_count-180))+"\n"
                        else:
                            if self.control.move_count==0:
                                command=cmd.CMD_WORKING_TIME+'#'+str(round(self.control.move_count))+'#'+str(round((time.time()-self.control.move_timeout)+60))+"\n"
                            else:
                                command=cmd.CMD_WORKING_TIME+'#'+str(round(self.control.move_count))+'#'+str(round(time.time()-self.control.move_timeout))+"\n"
                    else:
                        command=cmd.CMD_WORKING_TIME+'#'+str(round(self.control.move_count))+'#'+str(0)+"\n"
                    self.send_data(self.connection1,command)
                else:
                    self.control.order=data
                    self.control.timeout=time.time()
           
        socketio.run(app, "0.0.0.0", port=PORT,debug=False)        
        
if __name__ == '__main__':
    server = Server()
    