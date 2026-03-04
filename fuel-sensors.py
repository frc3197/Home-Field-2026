import RPi.GPIO as GPIO
import threading
import requests
import time

post_url = 'http://homefield-2026:3000/add'
body = {'amount': 1}

SENSOR_1_PIN = 4
SENSOR_2_PIN = 22
SENSOR_3_PIN = 17
SENSOR_4_PIN = 27

debounceTime = 100
pollTime = 5

def add():
	r = requests.post(post_url, json=body)
	print(r)

def beam_break_callback(channel):
	print("Beam maybe broken")
	if channel == SENSOR_1_PIN or channel == SENSOR_2_PIN or channel == SENSOR_3_PIN or channel == SENSOR_4_PIN:
		thread = threading.Thread(target=check_still_active, args=(channel,))
		thread.start()
		print(channel)
		
def check_still_active(channel):
	time.sleep(pollTime/1000)
	if GPIO.input(channel) == GPIO.LOW:
		print('Channel {channel} adding')
		add()

GPIO.setmode(GPIO.BCM)

GPIO.setup(SENSOR_1_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_1_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=debounceTime)

GPIO.setup(SENSOR_2_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_2_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=debounceTime)

GPIO.setup(SENSOR_3_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_3_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=debounceTime)

GPIO.setup(SENSOR_4_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_4_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=debounceTime)

while True:
	pass

GPIO.cleanup()
