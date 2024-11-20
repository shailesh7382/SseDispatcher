// api.js
import axios from 'axios';
import config from './config';

export const loginUser = async (userId) => {
    const response = await axios.post(`${config.urls.login}`, { userId: userId.trim() }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data.token;
};

export const startAllPricing = async (token) => {
    const response = await axios.get(config.urls.startAllPricing, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const pauseAllPricing = async (token) => {
    const response = await axios.get(config.urls.pauseAllPricing, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchPricingState = async (token) => {
    const response = await axios.get(config.urls.pricingState, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchCcyPairs = async (token) => {
    const response = await axios.get(config.urls.ccyPairs, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const startPricing = async (ccyPair, token) => {
    const response = await axios.get(config.urls.startPricing, {
        params: { ccyPair },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const pausePricing = async (ccyPair, token) => {
    const response = await axios.get(config.urls.pausePricing, {
        params: { ccyPair },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};