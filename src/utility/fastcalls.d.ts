type CF__index = <K extends keyof CFrame>(cf: CFrame, index: K) => CFrame[K];
type CF__add = (cf: CFrame, operand: Vector3 | vector) => CFrame;

export declare const CF__index: CF__index;
export declare const CF__add: CF__add;