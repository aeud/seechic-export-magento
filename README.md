# See Chic Magento Exporter

## Install NodeJS

```
wget https://nodejs.org/dist/v4.1.1/node-v4.1.1.tar.gz
tar -zxvf node-v4.1.1.tar.gz
cd node-v4.1.1
./configure
make
sudo make install
```

```
node -v
```

## Web server

```
cd ~/path-to-app
npm install
node app
```

Open [localhost:4000](http://localhost:4000)

## CLI version

```
node cli -i /path/to/input.csv -o /path/to/output.csv
```

