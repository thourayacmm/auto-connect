const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./ai.service");

const health = catchAsync(async (_req, res) => {
  const data = await service.health();
  return successResponse(res, { message: "AI service is reachable", data });
});

const analyze = catchAsync(async (req, res) => {
  const data = await service.analyze(req.body);
  return successResponse(res, { message: "AI analysis completed", data });
});

const recommend = catchAsync(async (req, res) => {
  const data = await service.recommend(req.body);
  return successResponse(res, { message: "AI recommendations generated", data });
});

const score = catchAsync(async (req, res) => {
  const data = await service.score(req.body);
  return successResponse(res, { message: "AI score calculated", data });
});

const adaptLevel = catchAsync(async (req, res) => {
  const data = await service.adaptLevel(req.body);
  return successResponse(res, { message: "AI level adaptation generated", data });
});

const correctPhrase = catchAsync(async (req, res) => {
  const data = await service.correctPhrase(req.body);
  return successResponse(res, { message: "AI phrase correction completed", data });
});

const chat = catchAsync(async (req, res) => {
  const data = await service.chat(req.body);
  return successResponse(res, { message: "AI chat response generated", data });
});

const speechToText = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "audio_file is required" });
  }
  const data = await service.speechToText(req.file, req.body);
  return successResponse(res, { message: "AI speech transcription completed", data });
});

module.exports = { health, analyze, recommend, score, adaptLevel, correctPhrase, chat, speechToText };
