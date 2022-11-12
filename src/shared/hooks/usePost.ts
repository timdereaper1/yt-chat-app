import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ZodAny, ZodObject, ZodTypeAny } from 'zod';

type UsePostOptions<TData, TResponse> = {
	path: string;
	validationSchema?: ZodObject<{ [k in keyof TResponse]: ZodTypeAny }>;
} & Omit<UseMutationOptions<TResponse, AxiosError<TResponse, TData>, TData, unknown>, 'mutationFn'>;

export default function usePost<TData, TResponse>({
	path,
	validationSchema,
	...mutationOptions
}: UsePostOptions<TData, TResponse>) {
	async function post(values: TData) {
		const response = await axios.post<TResponse, AxiosResponse<TResponse, TData>, TData>(
			`http://localhost:8080/api/v1${path}`,
			values
		);
		if (validationSchema) validationSchema.parse(response.data);
		return response.data;
	}

	return useMutation<TResponse, AxiosError<TResponse, TData>, TData>(post, mutationOptions);
}
