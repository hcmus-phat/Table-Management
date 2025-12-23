import { ModifierGroup, ModifierOption } from "../models/index.js";
import { Op } from "sequelize";

export class ModifierService {
	static async createGroup(data) {
		//Check for existed group
		const existingGroup = await ModifierGroup.findOne({
			where: { 
                name: data.name,
                restaurant_id: data.restaurant_id //different restaurants
            },
		});
		if (existingGroup) {
			throw new Error("Modifier already exist");
		}

		//Create group
		return await ModifierGroup.create({
			restaurant_id: data.restaurant_id,
			name: data.name,
			selection_type: data.selection_type,
			is_required: data.is_required,
			min_selections: data.min_selections,
			max_selections: data.max_selections,
			display_order: data.display_order,
			status: data.status,
		});
	}

	static async updateGroup(id, data) {
		//Check if group exists
		const foundGroup = await ModifierGroup.findByPk(id);
		if (!foundGroup) {
			throw new Error("Modifier does not exist");
		}

		//Check if group name is used
		const existingGroupName = await ModifierGroup.findOne({
			where: {
				name: data.name,
                restaurant_id: foundGroup.restaurant_id, //different restaurants
				id: { [Op.ne]: id },
			},
		});
		if (existingGroupName) {
			throw new Error("Modifier name already exist");
		}

		//Update fields in data
		return await foundGroup.update(data);
	}

	static async createOption(data) {
        //Check for existed option
		const existingOption = await ModifierOption.findOne({
			where: { 
                name: data.name,
                group_id: data.group_id //different groups
            },
		});

		if (existingOption) {
			throw new Error("Option already exist");
		}

        //Create option
		return await ModifierOption.create({
			group_id: data.group_id,
			name: data.name,
			price_adjustment: data.price_adjustment,
			status: data.status
		});
	}

    static async updateOption(id, data) {
        //Check if option exists
        const foundOption = await ModifierOption.findByPk(id);
        if(!foundOption) {
            throw new Error("Option not found");
        }

        //Check if option name is used
        const existingOptionName = await ModifierOption.findOne({
            where: {
                name: data.name,
                group_id: foundOption.group_id, //different groups
                id: { [Op.ne]: id}
            }
        });

        if(existingOptionName) {
            throw new Error("Option name already exist");
        }

        return await foundOption.update(data);
    }
}
