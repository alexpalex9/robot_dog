#!/usr/bin/env python
from flask import Flask, render_template, Response
from flask_socketio import SocketIO

import io
from time import time


import sys
PORT = 51

DEV = True

if DEV!=True:
    import picamera
    from base_camera import BaseCamera
    class Camera(BaseCamera):
        @staticmethod
        def frames():
            with picamera.PiCamera() as camera:
                # let camera warm up
                #time.sleep(2)
    
                stream = io.BytesIO()
                for _ in camera.capture_continuous(stream, 'jpeg',
                                                     use_video_port=True):
                    # return current frame
                    stream.seek(0)
                    yield stream.read()
    
                    # reset stream for next frame
                    stream.seek(0)
                    stream.truncate()

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

@app.route('/stream')
def video_feed():
    return Response(gen(Camera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print(sys.argv)
    #app.run(host='0.0.0.0', debug=True)
    socketio.run(app, "0.0.0.0", port=PORT)
    #t2 = threading.Thread(socketio.run(app, "0.0.0.0", port=PORT))
    #t2.start()