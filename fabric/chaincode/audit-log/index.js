"use strict";

const { Contract } = require("fabric-contract-api");

class AuditLogContract extends Contract {
  async CreateLog(ctx, key, payload) {
    const exists = await ctx.stub.getState(key);
    if (exists && exists.length > 0) {
      throw new Error(`Log ${key} already exists`);
    }
    await ctx.stub.putState(key, Buffer.from(payload));
    return payload;
  }

  async GetLog(ctx, key) {
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Log ${key} not found`);
    }
    return data.toString();
  }

  async GetLogsByDocument(ctx, documentId) {
    const iterator = await ctx.stub.getStateByRange("", "");
    const results = [];
    for await (const res of iterator) {
      try {
        const value = JSON.parse(res.value.toString());
        if (String(value.document_id) === String(documentId)) {
          results.push(value);
        }
      } catch {
        // ignore malformed
      }
    }
    return JSON.stringify(results);
  }
}

module.exports = AuditLogContract;
