import fs from "fs";
import express from "express";
import { connect, signers } from "@hyperledger/fabric-gateway";

const {
  FABRIC_CONNECTION_PROFILE = "",
  FABRIC_MSP_ID = "",
  FABRIC_CERT_PATH = "",
  FABRIC_KEY_PATH = "",
  FABRIC_CHANNEL = "mychannel",
  FABRIC_CHAINCODE = "auditlog",
  PORT = 8801,
} = process.env;

const app = express();
app.use(express.json());

let gateway = null;
let network = null;
let contract = null;

function loadIdentity() {
  if (!FABRIC_CONNECTION_PROFILE || !FABRIC_CERT_PATH || !FABRIC_KEY_PATH || !FABRIC_MSP_ID) {
    return null;
  }
  const cert = fs.readFileSync(FABRIC_CERT_PATH);
  const key = fs.readFileSync(FABRIC_KEY_PATH);
  const ccp = JSON.parse(fs.readFileSync(FABRIC_CONNECTION_PROFILE, "utf8"));
  return { cert, key, ccp };
}

async function initGateway() {
  const identity = loadIdentity();
  if (!identity) {
    return false;
  }
  const { cert, key, ccp } = identity;
  const signer = signers.newPrivateKeySigner(key);
  gateway = connect({
    identity: { mspId: FABRIC_MSP_ID, credentials: cert },
    signer,
    connectionProfile: ccp,
  });
  network = gateway.getNetwork(FABRIC_CHANNEL);
  contract = network.getContract(FABRIC_CHAINCODE);
  return true;
}

app.get("/health", async (_req, res) => {
  const ok = await initGateway();
  res.status(ok ? 200 : 503).json({ ok });
});

app.post("/logs", async (req, res) => {
  try {
    const ok = await initGateway();
    if (!ok || !contract) {
      return res.status(503).json({ error: "Fabric not configured" });
    }
    const payload = req.body || {};
    const key = `log:${payload.id || Date.now()}`;
    await contract.submitTransaction("CreateLog", key, JSON.stringify(payload));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/logs", async (req, res) => {
  try {
    const ok = await initGateway();
    if (!ok || !contract) {
      return res.status(503).json({ error: "Fabric not configured" });
    }
    const documentId = req.query.document_id || "";
    const result = await contract.evaluateTransaction("GetLogsByDocument", String(documentId));
    res.json(JSON.parse(result.toString()));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Fabric gateway listening on http://localhost:${PORT}`);
});
