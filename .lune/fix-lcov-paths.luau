local fs = require("@lune/fs") :: fs
local path = "coverage/lcov.info"
local lcov = fs.readFile(path)
lcov = lcov:gsub("\\", "/")
fs.writeFile(path, lcov)
