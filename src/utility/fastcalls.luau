local info = debug.info
local identity = CFrame.identity
local lune = string.sub(_VERSION, 1, 4) == "Lune"

local _, CF__index = xpcall(function()
  return identity[nil]
end, function()
  return info(2, "f")
end)

if lune then
  CF__index = function(cframe, key)
    return cframe[key]
  end
end

return {
  CF__index = CF__index
}