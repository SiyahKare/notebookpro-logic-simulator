import Iyzipay from 'iyzipay';
import { env } from './env.js';

const iyzipay = new Iyzipay({
  apiKey: env.IYZIPAY_API_KEY,
  secretKey: env.IYZIPAY_SECRET_KEY,
  uri: env.IYZIPAY_URI,
});

export default iyzipay;
