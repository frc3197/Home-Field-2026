# HomeField-26 Writeup

- [Preamble](#preamble)
- [Physical Construction](#physical-construction)
- [Code](#code)
- [Software Configuration](#software-configuration)
- [Issues we faced](#issues-we-faced)
- [Concluding-Thoughts](#concluding-thoughts)

## Preamble
This document explains the process of creating a home-made field management system, proper hub, fuel counting, and active/inactive period management. There are two sections of code. 
 - Backend, which includes:
    - [fuel-sensors.py](https://github.com/frc3197/Home-Field-2026/blob/main/fuel-sensors.py) - Which manages counting fuel and sending the data to the frontend
    - [hub-lights.py](https://github.com/frc3197/Home-Field-2026/blob/main/hub-lights.py])- Which interacts with the Driver Station to facilitate active and inactive periods
 - Server
    - Which runs an API for the backend and client to communicate, written in express.js
 - Client
    - Which displays the information gathered by the backend in a nice, user-friendly, webpage

There is also a physical component, 
 - Modified hub internals
    - Added CIM Motor, Belts, and Wheels
        - For moving fuel out of the hub/limiting 
    - Added ALT-0560T ALITOV Power Supply
    - Added Breadboard
    - Added Raspberry Pi 4
 - 

## Physical Construction

 - [Hub](#hub)
 - [Parts](#parts)

### Hub

The outer shell remains the same according to the real game field.

The only visible difference is the visible infared laser sensors and motorized wheels.

Here is a photo of the Modified Hub, viewed from the Red Alliance Zone,

![Image of the Modified Hub. Shell Closed, From Alliance Zone]()

Here is a photo of the Modified Hub, viewed from the Neutral Zone,

![Image of the Modified Hub. Shell Closed, From Neutral Zone]()

Internally, many diffrences can be found. 

![Image of the Internal Hub, From Alliance Zone]()

A hole was cut, connecting our FMS Table to the inside of the hub, via the upper support of the trench and the empty underside of the bump. 

This hole connects power to the ALT-0560T ALITOV Power Supply, which powers the CIM motor that drives a system of belts to control the wheels, that push fuel out of the hub. 

It also connects an ethernet cable from the field access point, which connects the Pi to the Field Management System and the Driver Station.
 
This Pi drives a set of LED Lights, which turn on depending on the period. It also counts how many balls go through the hub, via infared sensors.


![Image of the Modified Hub. Shell Open, From Alliance Zone]()

![Image of the Modified Hub. Shell Open, From Neutral Zone]()


### Parts

This is the full list of parts we added:
 - 1 Cim Motor
 - 3 Belts
 - 1 ALT-0560T ALITOV Power Supply
 - 1 Raspberry Pi 4
 - Set of jumper wires
 - 4 Sets of infared sensors/beambreaks

## Code

Please note all comments in the code have been removed in examples, as the comments have been rendered useless by the explainations found above examples

- [Backend](#backend)
- [Server/Api](#server-and-api)
- [Client](#client)
- [Configuration](#configuration)

### Backend

The backend is written in Python. It contains two files

### [fuel-sensors.py](https://github.com/frc3197/Home-Field-2026/blob/main/fuel-sensors.py)

The fuel-sensors.py file does 3 major actions. 
- Listens to the Infared/Beam-break sensors
- Determines if the data from the sensors are real
- Sends the data to the server for display on the client

#### Listening
The code first setups the 4 pins for each sensor pair, at pin 4, 22, 17, and 27, setting them to In pins, and setting the callback function. 

    
    GPIO.setup(SENSOR_1_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    GPIO.add_event_detect(SENSOR_1_PIN, GPIO.FALLING, callback=beam_break_callback, bouncetime=debounceTime)
    
#### Checking for Real Events
Due to the inaccuracies of the sensors used, we needed to program a way of checking if an event was a real fuel going through the hub, or just a misfire. We did this by waiting 100 MS between fires. If after 100 MS after the first fire, the fuel is still being detected by the sensors, we can presume its a real event, as the misfires happen for a few MS at most, while a ball wouldn't get through the sensors in that time. 

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

#### Sending to server
Finally, the data needs to be sent to the node server/api so the client can see the data. This is done by sending a post request to the express server. 

    def add():
	    r = requests.post(post_url, json=body)
	    print(r)

### [hub-lights.py](https://github.com/frc3197/Home-Field-2026/blob/main/hub-lights.py)

The hub lights file is a bit more complicated than the fuel-sensors, being at 183 lines, compared to the 52 of  fuel-sensors.py. It's main functions are:

- Connecting to the DriverStation/FMS
- Setting up the NeoPixels
- Defining the animations
- Setting up period management logic
- Main Loop

#### Connecting to the Driver Station
The hub lights use the driver station to determine which hub is active first and is there currently a game. It uses what the driver selects as the robot's alliance to determine which alliance "won" auto. The selected alliance wins. Here is the code that connects to the NetworkTable
    
    NetworkTables.initialize(server='roborio-3197-frc.local')
    NetworkTables.setUpdateRate(50)
    fms = NetworkTables.getTable('FMSInfo')
    sd = NetworkTables.getTable('SmartDashboard')

    loopid = 0

    period_value = fms.getAutoUpdateValue("FMSControlData", -1)

#### Setting up the NeoPixels
Next, we must setup the NeoPixels for display. We select a pin to be used for connecting to the pixels, in our case, D18. We then tell the NeoPixel Lib how many pixels we are using, 50 in our setup. Then, we tell the library the order to our pixels, Our case is special, as for some reason our team's pixels we found used GRB, not RGB. 

    pixel_pin = board.D18

    num_pixels = 50

    ORDER = neopixel.GRB

    pixels = neopixel.NeoPixel(
        pixel_pin, num_pixels, brightness=0.2, auto_write=False, pixel_order=ORDER
    )

#### Defining the animations
We have a few animations displayed on the neopixels, a disconnected animation which plays when no robot is connected, a warning animation where the lights flash letting the drivers know the hub will become inactive, and an active animation. This is an example of the race animation, which is displayed when disconnected.

    def race(loopid):
    
        for i in range(num_pixels):
           pixels[i] = (0, 0, 0)
    
        scaled = math.floor(loopid / 50)
    
        pixels[scaled % 50] = (100, 252, 3)
            pixels[(scaled + 1) % 50] = (100, 252, 3)
        
        pixels.show()

#### Setting up period management logic


### Server and API

Technically, this too is apart of the backend. However, the backend python sends requests to a node server/api, so we are including it as a seperate section. 

### Client

## Software Configuration
 - [Networking](#networking)
 - [SystemD](#systemd)

## Issues we faced
- [Networking Issues](#networking-Issues)
- [Software Bugs](#software-Bugs)
- [Git Issues](#git-issues)
- [Raspberry Pi Issues](#raspberry-pi-issues)
- [Motor Issues](#motor-issues)

### Networking Issues

### Software Bugs

### Git Issues

### Raspberry PiIssues

### Motor Issues

## Concluding Thoughts