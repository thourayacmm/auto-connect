const axios = require("axios");
const { Blob } = require("buffer");
const env = require("../../config/env");
const { ApiError } = require("../../utils/ApiError");

const aiHttpClient = axios.create({
  baseURL: env.fastApiBaseUrl,
  timeout: env.fastApiTimeoutMs,
  headers: { "Content-Type": "application/json" },
});

const buildAiError = (path, error) => {
  const status = error.response?.status || 503;
  const message =
    error.response?.data?.message || error.response?.data?.detail || `AI service unavailable for ${path}`;
  return new ApiError(status, message, error.response?.data || null);
};

const callAi = async (path, payload) => {
  try {
    const response = await aiHttpClient.post(path, payload);
    return response.data;
  } catch (error) {
    throw buildAiError(path, error);
  }
};

const getAi = async (path) => {
  try {
    const response = await aiHttpClient.get(path);
    return response.data;
  } catch (error) {
    throw buildAiError(path, error);
  }
};

const postAiMultipart = async (path, file, fields = {}) => {
  try {
    const formData = new FormData();
    formData.append(
      "audio_file",
      new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" }),
      file.originalname || "audio.webm",
    );
    Object.entries(fields).forEach(([key, value]) => {
      if (value != null) {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${env.fastApiBaseUrl}${path}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }

    return data;
  } catch (error) {
    throw buildAiError(path, error);
  }
};

module.exports = { callAi, getAi, postAiMultipart };
