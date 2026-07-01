#!/usr/bin/env node
/**
 * avots-mcp — discovery / introspection stub (stdio MCP).
 *
 * avots is a HOSTED, remote MCP server: Streamable HTTP at https://mcp.avots.ai/
 * with `Authorization: Bearer av_mcp_…`. That endpoint is auth-gated on every
 * method (incl. `initialize`), so tools like Glama can't boot + introspect it.
 *
 * This tiny stdio server exists only so an indexer can start a container and read
 * the real tool catalogue (`tools/list`) without a key. It performs NO generation:
 * every `tools/call` just points back at the hosted endpoint. The tool list is the
 * authoritative catalogue exported from the live server (stub/tools.json).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'tools.json'), 'utf8'));
const TOOLS = Array.isArray(catalog) ? catalog : (catalog.tools || []);
const PROTOCOL_VERSION = '2024-11-05';
const HOSTED = 'https://mcp.avots.ai/';

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }
function ok(id, result) { if (id !== undefined && id !== null) send({ jsonrpc: '2.0', id, result }); }
function fail(id, code, message) { if (id !== undefined && id !== null) send({ jsonrpc: '2.0', id, error: { code, message } }); }

function handle(req) {
  const { id, method } = req || {};
  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'avots-mcp', version: '1.0.0' },
        instructions:
          'avots — hosted multi-model AI media + chat MCP server (image, video, audio, ' +
          'face-swap, talking-avatar generation and chat across 300+ models). This stub ' +
          'answers discovery only; run tools against ' + HOSTED + ' with a Bearer key. ' +
          'Docs: https://github.com/avotsai/avots-mcp',
      });
    case 'notifications/initialized':
    case 'initialized':
      return; // notification — no response
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: TOOLS });
    case 'resources/list':
      return ok(id, { resources: [] });
    case 'prompts/list':
      return ok(id, { prompts: [] });
    case 'tools/call':
      return ok(id, {
        content: [{
          type: 'text',
          text: 'This is the avots discovery stub — it does not execute tools. Run this tool ' +
                'against the hosted server at ' + HOSTED + ' (Streamable HTTP, ' +
                'Authorization: Bearer av_mcp_…). See https://github.com/avotsai/avots-mcp',
        }],
        isError: false,
      });
    default:
      return fail(id, -32601, 'Method not found: ' + method);
  }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let req;
    try { req = JSON.parse(line); } catch (_) { continue; }
    try { handle(req); } catch (e) { fail(req && req.id, -32603, 'Internal error: ' + (e && e.message)); }
  }
});
process.stdin.on('end', () => process.exit(0));
