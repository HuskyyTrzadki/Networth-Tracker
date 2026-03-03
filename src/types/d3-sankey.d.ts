declare module "d3-sankey" {
  export type SankeyNodeLike = Readonly<Record<string, unknown>>;
  export type SankeyLinkLike = Readonly<Record<string, unknown>>;

  export type SankeyNodeLayout<Node extends SankeyNodeLike> = Node & {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    value: number;
  };

  export type SankeyLinkLayout<
    Node extends SankeyNodeLike,
    Link extends SankeyLinkLike,
  > = Link & {
    source: SankeyNodeLayout<Node>;
    target: SankeyNodeLayout<Node>;
    y0: number;
    y1: number;
    width: number;
  };

  export type SankeyGraph<Node extends SankeyNodeLike, Link extends SankeyLinkLike> = {
    nodes: SankeyNodeLayout<Node>[];
    links: SankeyLinkLayout<Node, Link>[];
  };

  export type SankeyNodeAlign<Node extends SankeyNodeLike> = (
    node: SankeyNodeLayout<Node>,
    n: number
  ) => number;

  export interface SankeyGenerator<Node extends SankeyNodeLike, Link extends SankeyLinkLike> {
    (graph: { nodes: Node[]; links: Link[] }): SankeyGraph<Node, Link>;
    nodeId(nodeId: (node: Node) => string): this;
    nodeAlign(align: SankeyNodeAlign<Node>): this;
    nodeWidth(width: number): this;
    nodePadding(padding: number): this;
    extent(extent: [[number, number], [number, number]]): this;
    iterations(iterations: number): this;
  }

  export function sankey<Node extends SankeyNodeLike, Link extends SankeyLinkLike>(): SankeyGenerator<Node, Link>;

  export function sankeyLinkHorizontal<
    Node extends SankeyNodeLike,
    Link extends SankeyLinkLike,
  >(): (link: SankeyLinkLayout<Node, Link>) => string;

  export function sankeyJustify<Node extends SankeyNodeLike>(
    node: SankeyNodeLayout<Node>,
    n: number
  ): number;
}
