export interface NetworkNode {
    id: number | string;
    type: NetworkNodeType;
    appearances: number;
    x?: number;
    y?: number;
}

export enum NetworkNodeType {
    Worker = "extra",
    Employer = "establishment"
}