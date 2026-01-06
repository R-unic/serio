import { TestRunner } from "@rbxts/runit";
import { instrument, istanbul } from "@rbxts/coverage";

const http = game.GetService("HttpService");
const replicated = game.GetService("ReplicatedStorage");
instrument([replicated.WaitForChild("Library")]);

const testRunner = new TestRunner(replicated.WaitForChild("Tests"));
testRunner.run({ colors: true })
  .then(() => {
    const report = istanbul();
    const reportJSON = http.JSONEncode(report);
    const coverageValue = new Instance("StringValue");
    coverageValue.Name = "coverage";
    coverageValue.Value = reportJSON;
    coverageValue.Parent = replicated;
  });