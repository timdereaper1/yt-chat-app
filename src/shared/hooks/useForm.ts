import React from 'react';
import { ZodEffects, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

type FormActions = {
	resetForm(): void;
};

export default function useForm<TFieldValues extends {}>({
	initialValues,
	validationSchema,
	onSubmit,
}: {
	initialValues: TFieldValues;
	validationSchema:
		| ZodObject<{ [k in keyof TFieldValues]: ZodTypeAny }>
		| ZodEffects<ZodObject<{ [k in keyof TFieldValues]: ZodTypeAny }>>;
	onSubmit: (values: TFieldValues, actions: FormActions) => void;
}) {
	const [errors, setErrors] = React.useState<{ [k in keyof TFieldValues]?: string[] }>();
	const [values, setValues] = React.useState(initialValues);

	const hasErrors = Boolean(errors);
	const hasInputtedValues = Object.keys(values).some(
		(key) => !!values[key as keyof TFieldValues]
	);

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.currentTarget;
		const updatedValues = { ...values, [name]: value };
		setValues(updatedValues);
		const validate = validationSchema.safeParse(updatedValues);
		if (validate.success) return setErrors(undefined);
		setErrors(validate.error.formErrors.fieldErrors as any);
	}

	function resetForm() {
		setValues(initialValues);
		setErrors(undefined);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrors(undefined);
		onSubmit(values, { resetForm });
	}

	return {
		handleChange,
		handleSubmit,
		values,
		invalid: hasErrors || !hasInputtedValues,
		errors,
	};
}
