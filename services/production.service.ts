'use strict';

import { ActionParams, Context, Errors, Service, ServiceBroker } from 'moleculer';
import fs from 'fs';
import DbConnection from '../mixins/db.mixin';

const { MoleculerClientError, MoleculerServerError } = Errors;

const productDetails = {
	type: 'object',
	props: {
		size: {
			type: 'string',
			optional: true,
		},
		piece: {
			type: 'string',
			optional: true,
		},
	},
};

const createParams: ActionParams = {
	barcode: 'string',
	name: 'string',
	wholeSalePrice: 'number',
	grossProfit: 'number',
	endUserPrice: 'number',
	productDetails: {
		type: 'array',
		item: productDetails,
	},
	$$strict: true,
};

const updateParams: ActionParams = {
	id: 'string',
	...createParams,
};

export default class ProductService extends Service {
	private DbMixin = new DbConnection('products').start();
	public constructor(public broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: 'products',
			mixins: [this.DbMixin],
			version: 1,
			settings: {},
			actions: {
				create: {
					params: createParams,
				},

				update: {
					params: updateParams,
				},

				uploadImage: {
					rest: {
						method: 'POST',
						path: '/upload-image',
					},
					async handler(ctx: Context<any>) {
						const { $multipart, filename } = ctx.meta as any;
						const { id, key } = $multipart;
						const dir = `../public/images/${id}`
						if (!fs.existsSync(dir)) {
							fs.mkdirSync(dir);
						}
						const filePath = fs.createWriteStream(`${dir}/${filename}`);
						ctx.params.pipe(filePath);
						return {
							status: 'done',
							id,
							key,
						};
					},
				},
			},

			started: async () => {
				// await this.migrate();
			},
		});
	}
}
