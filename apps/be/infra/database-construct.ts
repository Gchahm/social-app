import { Construct } from 'constructs';
import {
  AttributeType,
  ProjectionType,
  Table,
  TableEncryption,
} from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import { EnvironmentConfig } from './configs';
import { APP_NAME } from './constants';

export type DatabaseConstructProps = EnvironmentConfig;

export class DatabaseConstruct extends Construct {
  public table: Table;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Single-table design for social media application
    // Stores Users, Posts, Likes, Comments, and Follows
    this.table = new Table(this, `${APP_NAME}-table`, {
      partitionKey: {
        name: 'PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING,
      },
      billingMode: props.tableBillingMode,
      removalPolicy: props.tableRemovalPolicy,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: props.pointInTimeRecoverySpecification,
      deletionProtection: props.tableRemovalPolicy === RemovalPolicy.RETAIN,
    });

    // GSI1: User-Entity Index
    // Purpose: Query entities by user (user's posts, likes, comments, follows)
    // Access patterns:
    // - Get all posts by a user
    // - Get all likes by a user
    // - Get all comments by a user
    // - Get all followers of a user
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI2: Email/Username Lookup
    // Purpose: Find users by email or username
    // Access patterns:
    // - Get user by email
    // - Get user by username
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'GSI2PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI2SK',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI3: Feed Index
    // Purpose: Global feed of all posts sorted by timestamp
    // Access patterns:
    // - Get global feed (all posts, newest first)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: {
        name: 'GSI3PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI3SK',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
