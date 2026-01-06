local roblox = require("@lune/roblox") :: roblox
local fs = require("@lune/fs") :: fs
local luau = require("@lune/luau") :: luau
local process = require("@lune/process") :: process
local serde = require("@lune/serde") :: serde
local task = require("@lune/task") :: task

local signal = require("./mock-signal")

local testPlacePath = process.args[1]
local game = roblox.deserializePlace(fs.readFile(testPlacePath))
local threads: { thread } = {}

-- rUnit uses lemon signal
roblox.implementProperty("BindableEvent", "Event", function(get)
	return signal.new()
end)

local function tableJoin(...)
	local result = {}
	for i = 1, select("#", ...) do
		for k, v in select(i, ...) do
			result[k] = v
		end
	end
	return result
end

-- RuntimeLib uses :WaitForChild(), but tests don't need networking so :FindFirstChild() should be fine
roblox.implementMethod("Instance", "WaitForChild", function(self, ...)
	return self:FindFirstChild(...)
end)

-- Promise.lua indexes RunService.Heartbeat, but only uses it in Promise.defer and Promise.delay
local heartbeat = signal.new()
roblox.implementProperty("RunService", "Heartbeat", function()
	return heartbeat
end, function() end)

table.insert(
	threads,
	task.spawn(function()
		local lastFrame = os.clock()
		while true do
			task.wait()
			local dt = os.clock() - lastFrame
			heartbeat:Fire(dt)
		end
	end)
)

roblox.implementMethod("RunService", "IsStudio", function()
	return true
end)

roblox.implementMethod("RunService", "IsServer", function()
	return true
end)

roblox.implementMethod("RunService", "IsClient", function()
	return false
end)

roblox.implementMethod("RunService", "IsRunning", function()
	return false
end)

roblox.implementMethod("DataModel", "IsLoaded", function()
	return true
end)

roblox.implementProperty("Players", "LocalPlayer", function()
	return roblox.Instance.new("Player")
end)

roblox.implementMethod("HttpService", "JSONEncode", function(self, value)
	return serde.encode("json", value)
end)

local requireCache = {}
local requireFrom
local runRobloxScript

local function createRobloxRequire(script: Instance)
	local function robloxRequire(moduleScript: ModuleScript)
		if typeof(moduleScript) == "string" then
			return requireFrom(script, moduleScript, robloxRequire)
		end

		-- the same script instance sometimes gives a different ref
		-- unsure why, but using :GetFullName() fixes this for now
		local scriptPath = moduleScript:GetFullName()
		local cached = requireCache[scriptPath]
		if cached then
			return table.unpack(cached)
		end

		local result = table.pack(runRobloxScript(moduleScript))
		requireCache[scriptPath] = result
		return table.unpack(result)
	end

	return robloxRequire
end

function runRobloxScript(script: Script | LocalScript | ModuleScript)
	assert(typeof(script) == "Instance", "script is not an instance")
	local robloxRequire = createRobloxRequire(script)
	local callableFn = luau.load(luau.compile(script.Source), {
		debugName = script:GetFullName(),
		environment = tableJoin(roblox, {
			Instance = roblox.Instance,
			game = game,
			script = script,
			require = robloxRequire,
			tick = tick,
			task = task,
			debug = debug,
		}),
	})

	return callableFn()
end

local function split(path): { string }
	local t = {}
	for part in string.gmatch(path, "[^/]+") do
		table.insert(t, part)
	end
	return t
end

local function resolveRelative(base: Instance, path: string): Instance
	local parts = split(path)
	local current = base

	for _, part in ipairs(parts) do
		if part == "." then
			-- stay
		elseif part == ".." then
			current = current.Parent
			assert(current, "Invalid require path: too many '..'")
		else
			local old = current
			current = current:FindFirstChild(part)
			assert(current, "Module not found: " .. old:GetFullName() .. "." .. part)
		end
	end

	return current
end

function requireFrom(script: Instance, path: string, robloxRequire)
	if not robloxRequire then
		robloxRequire = createRobloxRequire(script)
	end
	path = string.gsub(path, "@self", "./src/")

	-- relative paths
	if string.sub(path, 1, 1) == "." then
		local instance = resolveRelative(script.Parent, path)
		assert(instance, "no instance found at path " .. path .. " in " .. script.Parent:GetFullName())
		return robloxRequire(instance)
	end

	-- fallback
	return robloxRequire(path)
end

runRobloxScript(game.ReplicatedStorage.Tests["run-tests"])
local reportJSON = game.ReplicatedStorage.coverage.Value
fs.writeDir("coverage")
fs.writeFile("coverage/coverage-final.json", reportJSON)

for _, thread in threads do
	task.cancel(thread)
end
