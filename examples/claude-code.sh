#!/bin/sh
# Add avots as an HTTP MCP server in Claude Code. Replace the key before running.
claude mcp add --transport http avots https://mcp.avots.ai/ \
  --header "Authorization: Bearer av_mcp_YOUR_KEY_HERE"
