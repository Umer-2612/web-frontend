import type { NodeConfig } from "@/lib/system-design/types";

export const COMPONENT_TYPES = [
  "users",
  "route53",
  "cloudfront",
  "waf",
  "shield",
  "api_gateway",
  "alb",
  "ec2",
  "ecs",
  "lambda",
  "rds",
  "aurora",
  "dynamodb",
  "elasticache",
  "s3",
  "opensearch",
  "sqs",
  "sns",
  "kinesis",
  "cloudwatch",
  "cognito",
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export type ConfigKey = keyof NodeConfig;

export interface ComponentInfo {
  type: ComponentType;
  label: string;
  /** One line shown in the sidebar and the config panel. */
  description: string;
  group: GroupId;
  /** Served from /public/aws-icons, null for Users (not an AWS service). */
  icon: string | null;
  /** Keys the config panel offers; mirrors core-api's catalog. */
  config_keys: ConfigKey[];
  /** Applied when a node is dropped on the board; mirrors core-api's catalog defaults. */
  defaults: NodeConfig;
  /** Never reachable straight from users (databases, caches). */
  private?: boolean;
}

export type GroupId = "client" | "edge" | "compute" | "data" | "messaging" | "security";

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: "client", label: "Traffic" },
  { id: "edge", label: "Edge & networking" },
  { id: "compute", label: "Compute" },
  { id: "data", label: "Databases, cache & storage" },
  { id: "messaging", label: "Messaging" },
  { id: "security", label: "Security & monitoring" },
];

const icon = (type: ComponentType) => `/aws-icons/${type}.svg`;
const autoscaling = { enabled: false, min: 1, max: 10 };

export const CATALOG: ComponentInfo[] = [
  { type: "users", label: "Users", description: "Where the traffic comes from. Every design starts here.", group: "client", icon: null, config_keys: [], defaults: {} },
  { type: "route53", label: "Route 53", description: "DNS. Routes users to your entry point.", group: "edge", icon: icon("route53"), config_keys: [], defaults: {} },
  { type: "cloudfront", label: "CloudFront", description: "CDN. Caches responses close to users.", group: "edge", icon: icon("cloudfront"), config_keys: ["cache_hit_ratio"], defaults: { cache_hit_ratio: 0.8 } },
  { type: "api_gateway", label: "API Gateway", description: "Managed API front door with throttling and auth hooks.", group: "edge", icon: icon("api_gateway"), config_keys: ["provisioned_capacity"], defaults: { provisioned_capacity: 10_000 } },
  { type: "alb", label: "Load Balancer", description: "Spreads requests across instances in several zones.", group: "edge", icon: icon("alb"), config_keys: ["instances"], defaults: { instances: 1 } },
  { type: "ec2", label: "EC2 / Auto Scaling", description: "Virtual servers. Add more, or let an Auto Scaling group do it.", group: "compute", icon: icon("ec2"), config_keys: ["instances", "autoscaling", "multi_az"], defaults: { instances: 1, multi_az: false, autoscaling } },
  { type: "ecs", label: "ECS / Fargate", description: "Containers without managing servers.", group: "compute", icon: icon("ecs"), config_keys: ["instances", "autoscaling", "multi_az"], defaults: { instances: 1, multi_az: false, autoscaling } },
  { type: "lambda", label: "Lambda", description: "Functions that scale on demand, up to a concurrency limit.", group: "compute", icon: icon("lambda"), config_keys: ["concurrency_limit"], defaults: { concurrency_limit: 1000 } },
  { type: "rds", label: "RDS", description: "Managed relational database. One writer, optional read replicas.", group: "data", icon: icon("rds"), config_keys: ["size", "multi_az", "read_replicas"], defaults: { size: "medium", multi_az: false, read_replicas: 0 }, private: true },
  { type: "aurora", label: "Aurora", description: "Faster relational database with up to 15 read replicas.", group: "data", icon: icon("aurora"), config_keys: ["size", "multi_az", "read_replicas"], defaults: { size: "medium", multi_az: false, read_replicas: 0 }, private: true },
  { type: "dynamodb", label: "DynamoDB", description: "Key-value store that scales with the capacity you provision.", group: "data", icon: icon("dynamodb"), config_keys: ["provisioned_capacity"], defaults: { provisioned_capacity: 25_000 } },
  { type: "elasticache", label: "ElastiCache", description: "In-memory cache. Absorbs repeated reads before the database.", group: "data", icon: icon("elasticache"), config_keys: ["instances", "size", "multi_az", "cache_hit_ratio"], defaults: { instances: 1, size: "medium", multi_az: false, cache_hit_ratio: 0.8 }, private: true },
  { type: "s3", label: "S3", description: "Object storage for files, media and backups.", group: "data", icon: icon("s3"), config_keys: [], defaults: {} },
  { type: "opensearch", label: "OpenSearch", description: "Search and analytics over your data.", group: "data", icon: icon("opensearch"), config_keys: ["instances", "size", "multi_az"], defaults: { instances: 1, size: "medium", multi_az: false }, private: true },
  { type: "sqs", label: "SQS", description: "Queue. Smooths bursts so workers run at their own pace.", group: "messaging", icon: icon("sqs"), config_keys: [], defaults: {} },
  { type: "sns", label: "SNS", description: "Publish once, notify many subscribers.", group: "messaging", icon: icon("sns"), config_keys: ["provisioned_capacity"], defaults: { provisioned_capacity: 30_000 } },
  { type: "kinesis", label: "Kinesis", description: "Ordered event stream. Throughput scales with shards.", group: "messaging", icon: icon("kinesis"), config_keys: ["instances"], defaults: { instances: 1 } },
  { type: "waf", label: "AWS WAF", description: "Filters abusive requests and enforces rate limits.", group: "security", icon: icon("waf"), config_keys: [], defaults: {} },
  { type: "shield", label: "AWS Shield", description: "DDoS protection.", group: "security", icon: icon("shield"), config_keys: [], defaults: {} },
  { type: "cognito", label: "Cognito", description: "Sign-in and user identity.", group: "security", icon: icon("cognito"), config_keys: [], defaults: {} },
  { type: "cloudwatch", label: "CloudWatch", description: "Metrics, logs and alarms. How you know it is failing.", group: "security", icon: icon("cloudwatch"), config_keys: [], defaults: {} },
];

const BY_TYPE = new Map(CATALOG.map((c) => [c.type, c]));

export function getComponent(type: ComponentType): ComponentInfo {
  return BY_TYPE.get(type)!;
}

/** Drag payload key used between the sidebar and the canvas. */
export const DRAG_MIME = "application/x-aws-component";
