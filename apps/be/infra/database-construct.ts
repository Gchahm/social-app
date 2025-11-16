import { Construct } from 'constructs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';


export class DatabaseConstruct extends Construct {
  public table: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

     this.table = new Table(this, 'be-table', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'be-table',
    });
  }


}
