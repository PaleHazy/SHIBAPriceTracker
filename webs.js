// websocket approach to price gathering from coinmarket cap

const WebSocket = require('ws');
const url = 'wss://stream.coinmarketcap.com/price/latest';
const sub =
  '{"method":"subscribe","id":"price","data":{"cryptoIds":[5994],"index":"detail"}}';
const ws = new WebSocket(url, null, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
  },
  origin: 'https://coinmarketcap.com/',
});
ws.on('open', function open() {
  console.log('opened');
  ws.send(sub);
});
ws.on('error', (err) => {
  console.log('error:', err);
});
ws.on('message', (data) => {
  const result = JSON.parse(data);
  const price = result.d.cr.p;
  console.log('SHIBA INU price:', price);
});
