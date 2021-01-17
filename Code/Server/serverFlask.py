#!/usr/bin/env python
from flask import Flask, render_template, Response
from flask_socketio import SocketIO


import io
import time
import threading
import picamera

PORT = 5000

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
        app = Flask(__name__,
                    static_url_path='',
                    static_folder='public',
                    template_folder='view')
        socketio = SocketIO(app)
    
        @app.route('/')
        def index():
            return render_template('index.html')
        
        def gen(camera):
            while True:
                frame = camera.get_frame()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        @app.route('/stream.mjpg')
        def video_feed():
            return Response(gen(Camera()),
                            mimetype='multipart/x-mixed-replace; boundary=frame')
        
        @socketio.on('connect', namespace='/robot')
        def ws_conn():
            print('connect')
        
        @socketio.on('disconnect', namespace='/robot')
        def ws_disconn():
            print('disconnect')
        
        @socketio.on('cmd', namespace='/robot')
        def ws_cmd(allData):
            cmdArray=allData.split('\n')
            
            print(cmdArray)
            """
            if cmdArray[-1] !="":
                cmdArray==cmdArray[:-1]
            for oneCmd in cmdArray:
                data=oneCmd.split("#")
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
                    command=cmd.CMD_SONIC+'#'+str(self.sonic.getDistance())+"\n"
                    self.send_data(self.connection1,command)
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
            """
        socketio.run(app, "0.0.0.0", port=PORT,debug=True)
if __name__ == '__main__':
    server = Server()
    