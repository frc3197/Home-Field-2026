# Simple test for NeoPixels on Raspberry Pi
import time
import board
import neopixel
from networktables import NetworkTables
import math
import logging

logging.basicConfig(level=logging.DEBUG)

# Article: https://opensource.com/article/21/1/light-display-raspberry-pi

# As a client to connect to a robot
NetworkTables.initialize(server='roborio-3197-frc.local')
NetworkTables.setUpdateRate(50)
fms = NetworkTables.getTable('FMSInfo')
sd = NetworkTables.getTable('SmartDashboard')

loopid = 0

period_value = fms.getAutoUpdateValue("FMSControlData", -1)

# Choose an open pin connected to the Data In of the NeoPixel strip, i.e. board.D18
# NeoPixels must be connected to D10, D12, D18 or D21 to work.
pixel_pin = board.D18

# The number of NeoPixels
num_pixels = 50

# The order of the pixel colors - RGB or GRB. Some NeoPixels have red and green reversed!
# For RGBW NeoPixels, simply change the ORDER to RGBW or GRBW.
ORDER = neopixel.GRB

pixels = neopixel.NeoPixel(
    pixel_pin, num_pixels, brightness=0.2, auto_write=False, pixel_order=ORDER
)


def wheel(pos):
    # Input a value 0 to 255 to get a color value.
    # The colours are a transition r - g - b - back to r.
    if pos < 0 or pos > 255:
        r = g = b = 0
    elif pos < 85:
        r = int(pos * 3)
        g = int(255 - pos * 3)
        b = 0
    elif pos < 170:
        pos -= 85
        r = int(255 - pos * 3)
        g = 0
        b = int(pos * 3)
    else:
        pos -= 170
        r = 0
        g = int(pos * 3)
        b = int(255 - pos * 3)
    return (r, g, b) if ORDER in (neopixel.RGB, neopixel.GRB) else (r, g, b, 0)


def rainbow_cycle(wait):
    for j in range(255):
        for i in range(num_pixels):
            pixel_index = (i * 256 // num_pixels) + j
            pixels[i] = wheel(pixel_index & 255)
        pixels.show()
        time.sleep(wait)
        
def orange_solid():
    for i in range(num_pixels):
        pixels[i] = (100, 252, 3)
        
    pixels.show()

def active(isRed):
    
    for i in range(num_pixels):
        if isRed:
            pixels[i] = (0, 255, 0)
        else:
            pixels[i] = (0, 0, 255)
        
    pixels.show()
    
def inActive():
    
    for i in range(num_pixels):
        pixels[i] = (0, 0, 0)
        
    pixels.show()
    
def getIsActive(period, time, isRed, isActiveFirst):
    # If auto, then active
    if period == 35:
        return True
    
    # If endgame, then active
    if time < 30:
        return True
    
    if time > 130:
        return True
    
    importantTime = time - 30
    
    if math.floor(importantTime / 25) % 2 == 0:
        return not isActiveFirst
        
    return isActiveFirst

def getIsInWarning(time, period, isRed, firstAllianceInactive):
    if time > 130 and time < 133:
        if isRed and firstAllianceInactive == "B":
            return False
        else:
            if (not isRed) and firstAllianceInactive == "R":
                return False
        
    return (time - 30) % 25 < 3 and (not period == 35) and time < 135 and time > 35

def warningLights(isRed, loopid):
    brightness = math.floor((math.sin(loopid/20) + 1) / 2 * 255)
    for i in range(num_pixels):
        if isRed:
            pixels[i] = (0, brightness, 0)
        else:
            pixels[i] = (0, 0, brightness)
        
    pixels.show()

def race(loopid):
    
    for i in range(num_pixels):
        pixels[i] = (0, 0, 0)
    
    scaled = math.floor(loopid / 50)
    
    pixels[scaled % 50] = (100, 252, 3)
    pixels[(scaled + 1) % 50] = (100, 252, 3)
        
    pixels.show()

while True:
    isRed = fms.getBoolean("IsRedAlliance", False)
    #print(isRed)
    period = period_value.value
    #print(period)
    matchTimeRemaining = sd.getNumber("MatchTime", -1)
    firstAllianceInactive = fms.getNumber("GameSpecificMessage", "B")
    
    loopid = loopid+1
    #print(NetworkTables.isConnected())
    
    if not NetworkTables.isConnected():
        race(loopid)
        continue
    
    if matchTimeRemaining < 0:
        orange_solid()
        continue
    
    isActiveFirst = False
    
    if isRed:
        if firstAllianceInactive == "B":
            isActiveFirst = True
    
    if not isRed:
        if firstAllianceInactive == "R":
            isActiveFirst = True
    
    isActive = getIsActive(period, matchTimeRemaining, isRed, isActiveFirst)
    
    if isActive:
        if getIsInWarning(matchTimeRemaining, period, isRed, firstAllianceInactive):
            warningLights(isRed, loopid)
        else:
            active(isRed)
    else:
        inActive()
    
    #rainbow_cycle(0.001)  # rainbow cycle with 1ms delay per step
