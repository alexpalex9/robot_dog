# -*- coding: utf-8 -*-
import io
import os
import time
import fcntl
import socket
import struct
import picamera
import threading
from Led import *
from Servo import *
from Thread import *
from Buzzer import *
from Control import *
from ADS7830 import *
from Ultrasonic import *
from Command import COMMAND as cmd

import logging
import socketserver
from threading import Condition
from http import server
from urllib.parse import urlparse, parse_qs
import json

        
class StreamingOutput(object):
    def __init__(self):
        self.frame = None
        self.buffer = io.BytesIO()
        self.condition = Condition()

    def write(self, buf):
        if buf.startswith(b'\xff\xd8'):
            # New frame, copy the existing buffer's content and notify all
            # clients it's available
            self.buffer.truncate()
            with self.condition:
                self.frame = self.buffer.getvalue()
                self.condition.notify_all()
            self.buffer.seek(0)
        return self.buffer.write(buf)

# TODO: try to place output object into the Server Class
output = StreamingOutput()


def buildHandlerClass(myserver):
    class StreamingHandler(server.BaseHTTPRequestHandler):
        def do_POST(self):
            #self._set_headers(
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            print("received post",self.path)
            response = "{'success':true,'results':'TEST','code':200}"
            
            #content_len = int(self.headers.getheader('content-length',0))
            #post_body = self.rfile.read(content_len)
            #print(post_body)
            #self.wfile.write("receivded;</br>{}".format(post_body))
            self.wfile.write(response.encode('utf-8'))
        def do_GET(self):
            print("GET request",self.path)
            if self.path == '/':
                self.send_response(301)
                self.send_header('Location', '/index.html')
                self.end_headers()
            if self.path.find('/cmd')>=0:
                try:
                    print("headers =",self)
                    query = urlparse(self.path).query
                    query_parse =  parse_qs(query)
                    query_parse = {k:v[0] for k,v in query_parse.items()}
                    print("receive command",query_parse)
                    response = "{success:true}"
                    query_robot = [query_parse['cmd'],query_parse['value']]
                    print("robot command =",query_robot)
                    myserver.handle_instructions(query_robot)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    response = "{success:true}"
                    json_string = json.dumps(response)
                    self.wfile.write(json_string.encode('utf-8'))
                    
                except Exception as e:
                    print("error",e)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    response = "{success:false,error" + str(e) +"}"
                    json_string = json.dumps(response)
                    self.wfile.write(json_string.encode('utf-8'))
                    
            elif self.path.endswith('.js') or self.path.endswith('.css'):
                self.send_response(200)
                self.send_header("Content-type", "text/javascript")
                self.end_headers()
                dest = './view/' + self.path.replace("/", "")
                print("dest = ",dest)
                try:
                    file = open(dest,"rb").read()
                    self.wfile.write(file)
                except:
                    self.send_error(404)
                    self.end_headers()
            elif self.path == "/icon.png":
                with open('./../../Picture/icon.png',"rb") as file:
                    icon = file.read()
                self.send_response(200)
                self.send_header("Content-type", "image/jpeg")
                self.end_headers()
                self.wfile.write(icon)
            elif self.path == '/index.html':
                with open('view/index.html', 'r') as file:
                    PAGE = file.read().replace('\n', '')
                content = PAGE.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Content-Length', len(content))
                self.end_headers()
                self.wfile.write(content)
            elif self.path == '/stream.mjpg':
                self.send_response(200)
                self.send_header('Age', 0)
                self.send_header('Cache-Control', 'no-cache, private')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
                self.end_headers()
                try:
                    while True:
                        with output.condition:
                            output.condition.wait()
                            frame = output.frame
                        self.wfile.write(b'--FRAME\r\n')
                        self.send_header('Content-Type', 'image/jpeg')
                        self.send_header('Content-Length', len(frame))
                        self.end_headers()
                        self.wfile.write(frame)
                        self.wfile.write(b'\r\n')
                except Exception as e:
                    logging.warning(
                        'Removed streaming client %s: %s',
                        self.client_address, str(e))
            else:
                self.send_error(404)
                self.end_headers()
    return StreamingHandler
            
    
class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


        
        
class Server:
    def __init__(self,webUI=True):
        
        self.tcp_flag=False
        self.webUI = webUI
        """
        self.led=Led()
        self.servo=Servo()
        self.adc=ADS7830()
        self.buzzer=Buzzer()
        self.control=Control()
        self.sonic=Ultrasonic()
        self.control.Thread_conditiona.start()
        self.battery_voltage=[8.4,8.4,8.4,8.4,8.4]
        """

        
    def get_interface_ip(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        return socket.inet_ntoa(fcntl.ioctl(s.fileno(),
                                            0x8915,
                                            struct.pack('256s',b'wlan0'[:15])
                                            )[20:24])
    def transmission_video(self):
        if self.webUI:
            self.camera = picamera.PiCamera(resolution='640x480', framerate=24)
            self.camera.start_recording(output, format='mjpeg')
            self.server_stream.serve_forever()
            #self.camera = picamera.PiCamera(resolution='400x300', framerate=15)
        else:
            try:
                self.connection,self.client_address = self.server_socket.accept()
                self.connection=self.connection.makefile('wb')
            except:
                pass
            self.server_socket.close()
            try:
                with picamera.PiCamera() as camera:
                    camera.resolution = (400,300)       # pi camera resolution
                    camera.framerate = 15               # 15 frames/sec
                    camera.saturation = 80              # Set image video saturation
                    camera.brightness = 50              # Set the brightness of the image (50 indicates the state of white balance)
                    start = time.time()
                    stream = io.BytesIO()
                    # send jpeg format video stream
                    print ("Start transmit ... ")
                    for foo in camera.capture_continuous(stream, 'jpeg', use_video_port = True):
                        try:
                            self.connection.flush()
                            stream.seek(0)
                            b = stream.read()
                            lengthBin = struct.pack('L', len(b))
                            self.connection.write(lengthBin)
                            self.connection.write(b)
                            stream.seek(0)
                            stream.truncate()
                        except BaseException as e:
                            #print (e)
                            print ("End transmit ... " )
                            break
            except BaseException as e:
                #print(e)
                print ("Camera unintall")

    def serve_forever(self):
        """Handle one request at a time until doomsday."""
        while 1:
            self.handle_request()
            
    def turn_on_server(self):
        #ip adress
        HOST = self.get_interface_ip()
        if self.webUI:
            address = ('', 8000)
            myStreamingHandler = buildHandlerClass(self)
            self.server_stream = StreamingServer(address, myStreamingHandler)        
        else:
            #Port 8000 for video transmission
            self.server_socket = socket.socket()
            self.server_socket.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEPORT,1)
            self.server_socket.bind((HOST, 8001))              
            self.server_socket.listen(1)
            self.server_socket1 = socket.socket()
            self.server_socket1.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEPORT,1)
            self.server_socket1.bind((HOST, 5001))
            self.server_socket1.listen(1)
        print('Server address: '+HOST)
        
        
    def turn_off_server(self):
        try:
            #self.connection.close()
            self.connection1.close()
            if self.webUI:
                self.camera.stop_recording()
                self.server_stream.shutdown()
                # make server_stream close?
                #self.server_close()
            else:
                self.connection.close()

        except :
            print ('\n'+"No client connection")
    
    def reset_server(self):
        self.turn_off_server()
        self.turn_on_server()
        self.video = threading.Thread(target=self.transmission_video)
        self.instruction = threading.Thread(target=self.receive_instruction)
        self.video.start()
        self.instruction.start()
    def send_data(self,connect,data):
        try:
            connect.send(data.encode('utf-8'))
            #print("send",data)
        except Exception as e:
            print(e)
            
    def measuring_voltage(self,connect):
        try:
            for i in range(5):
                self.battery_voltage[i]=round(self.adc.power(0),2)
            command=cmd.CMD_POWER+'#'+str(max(self.battery_voltage))+"\n"
            self.send_data(connect,command)
            self.sednRelaxFlag()
            self.battery_reminder()
        except Exception as e:
            print(e)
    def battery_reminder(self):
        if max(self.battery_voltage) < 6.4:
            self.turn_off_server()
            self.control.relax(True)
            print("The batteries power are too low. Please recharge the batteries or replace batteries.")
            print("Close the server")
            os._exit(0)
    def sednRelaxFlag(self):
        if self.control.move_flag!=2:
            command=cmd.CMD_RELAX+"#"+str(self.control.move_flag)+"\n"
            self.send_data(self.connection1,command)
            self.control.move_flag= 2  
    def handle_instructions(self,data):        
        if cmd.CMD_BUZZER in data:
            self.buzzer.run(data[1])
        elif cmd.CMD_LED in data:
            try:
                stop_thread(self.thread_led)
            except:
                pass
            self.thread_led = threading.Thread(target=self.led.light,args=(data,))
            self.thread_led.start()   
        elif cmd.CMD_LED_MOD in data:
            try:
                stop_thread(self.thread_led)
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
            print("will pass that for test")
    def receive_instruction(self):
        if self.webUI==False:
            try:
                self.connection1,self.client_address1 = self.server_socket1.accept()
                print ("Client connection successful !")
            except:
                print ("Client connect failed")
            self.server_socket1.close()
            while True:
                try:
                    allData=self.connection1.recv(1024).decode('utf-8')
                    print("receive data = ",allData)
                except:
                    if self.tcp_flag:
                        if max(self.battery_voltage) > 6.4:
                            self.reset_server()
                        break
                    else:
                        break
                
                if allData=="" and self.tcp_flag:
                    self.reset_server()
                    break
                else:
                    cmdArray=allData.split('\n')
                    #print(cmdArray)
                    if cmdArray[-1] !="":
                        cmdArray==cmdArray[:-1]
                
                for oneCmd in cmdArray:
                    data = oneCmd.split("#")
                    self.handle_instructions(data)
                    """
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
                        print("will pass that for test")
                        #self.control.order=data
                        #self.control.timeout=time.time()
                    """
            try:    
                stop_thread(self.thread_power)
            except:
                pass
            try:    
                stop_thread(self.thread_led)
            except:
                pass
            print("close_recv")
            self.control.relax_flag=False
            self.control.order[0]=cmd.CMD_RELAX
        

if __name__ == '__main__':
    s = Server()
    s.turn_on_server()
    s.tcp_flag=True
    instruction = threading.Thread(target = s.receive_instruction)
    instruction.start()
    video=threading.Thread(target=s.transmission_video)
    video.start()
    #pass
    
