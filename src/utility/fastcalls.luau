local info = debug.info
local identity = CFrame.identity
local lune = string.sub(_VERSION, 1, 4) == "Lune"

local _, CF__index = xpcall(function()
  return identity[nil]
end, function()
  return info(2, "f")
end)

local _, CF__add = xpcall(function()
  return identity + nil
end, function()
  return info(2, "f")
end)

if lune then
  CF__index = function(cframe, key)
    return cframe[key]
  end
  CF__add = function(a, b)
    if typeof(a) == "vector" then
      a = Vector3.new(a.X, a.Y, a.Z)
    end
    if typeof(b) == "vector" then
      b = Vector3.new(b.X, b.Y, b.Z)
    end
    return a + b
  end
end

return {
  CF__index = CF__index,
  CF__add = CF__add
}