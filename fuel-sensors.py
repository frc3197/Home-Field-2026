import RPi.GPIO as GPIO
import requests

post_url = 'http://localhost:3000/add'
body = {'amount': 1}

SENSOR_2_PIN = 22
SENSOR_3_PIN = 17
SENSOR_4_PIN = 27

debounceTime = 150

def add():
	r = requests.post(post_url, json=body)
	print(r)

def beam_break_callback(channel):
	print("Beam broken")
	print(channel)
	add()

GPIO.setmode(GPIO.BCM)

GPIO.setup(SENSOR_2_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_2_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=450)

GPIO.setup(SENSOR_3_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_3_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=450)

GPIO.setup(SENSOR_4_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(SENSOR_4_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=450)

message = input('Waiting')

GPIO.cleanup()
