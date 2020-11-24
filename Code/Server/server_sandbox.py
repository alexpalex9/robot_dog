# -*- coding: utf-8 -*-
"""
Created on Tue Nov 24 13:01:20 2020

@author: r392901
"""

# -*- coding: utf-8 -*-

"""



import http.server
import socketserver

PORT = 8001

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
    
    
"""
import threading


import logging
import socketserver
from threading import Condition
from http import server
from urllib.parse import urlparse, parse_qs
import json      

class StreamingHandler(server.BaseHTTPRequestHandler):
    def do_GET(self):
        print("GET request",self.path)
        if self.path == '/':
            self.send_response(301)
            self.send_header('Location', '/index.html')
            self.end_headers()
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
    
class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    #daemon_threads = True    
          
class Server:
    def __init__(self):        
        self.tcp_flag=False

    def transmission_video(self):
        self.server_stream.serve_forever()
            
    def turn_on_server(self):
        address = ('', 8002)   
        #☻StreamingHandler = http.server.SimpleHTTPRequestHandler
        #self.server_stream = StreamingServer(address, StreamingHandler)        
        #self.server_stream.serve_forever()
        with socketserver.TCPServer(address, StreamingHandler) as self.server_stream:
            self.server_stream.serve_forever()
                
    def turn_off_server(self):
        self.server_stream.shutdown()
    
    def reset_server(self):
        self.turn_off_server()
        self.turn_on_server()
        self.video = threading.Thread(target=self.transmission_video)
        self.instruction = threading.Thread(target=self.receive_instruction)
        self.video.start()
        self.instruction.start()
        


s = Server()
print("serving at port", 8000)
#s.turn_on_server()
server_thread = threading.Thread(target=s.server_stream.serve_forever)
server_thread.daemon = True
server_thread.start()
    #pass
    
