#! /usr/bin/env bash

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (or with sudo)."
   exit 1
fi

echo  "Beginning Installation process of HomeField-26"

echo "Installing Deps"

apt-get update -y
wait

apt-get upgrade -y
wait

apt-get install -y curl python3 git build-essential nodejs npm
wait

python3 -m pip install --break-system-packages -y robotpy Adafruit-circuitpython-neopixel Adafruit-blinka

echo  "Configuring Network"

nmcli connection show
wait

nmcli connection modify "netplan-eth0" \
    ipv4.addresses 10.31.97.99/8 \
    ipv4.dns "1.1.1.1,8.8.8.8,8.8.4.4" \
    ipv4.method manual \

wait

nmcli connection down "netplan-eth0"
wait

nmcli connection up "netplan-eth0"
wait

echo "Creating Directory"

cd /opt
wait

echo "Cloning Git Repo"
git clone https://github.com/frc3197/Home-Field-2026/
wait

cd /opt/Home-Field-2026/
wait

echo "Installing Node Modules"
npm install
wait

echo "Installing SystemD Services"
cp systemd/* /etc/systemd/system/
wait

systemctl daemon-reload
wait

systemctl enable HomeField26.target
wait

systemctl enable hf26-checkforupdates.service
wait

systemctl enable hf26-hublights.service
wait

systemctl enable hf26-fuel.service
wait

systemctl enable hf26-node.service
wait

echo "Reboot required, In 5 Seconds"
sleep 5
wait

systemctl reboot
