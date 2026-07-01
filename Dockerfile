# Discovery / introspection stub for indexers (e.g. Glama). avots is a HOSTED remote
# MCP server (Streamable HTTP + Bearer auth at https://mcp.avots.ai/); this container
# only speaks stdio MCP to expose the tool catalogue. It performs NO generation.
FROM node:20-alpine
WORKDIR /app
COPY stub/ ./stub/
ENTRYPOINT ["node", "stub/server.js"]
