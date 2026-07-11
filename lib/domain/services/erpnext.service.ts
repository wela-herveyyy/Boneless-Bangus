import type {
  ErpnextLoginInput,
  ErpnextLoginOutput,
  ErpnextRequestInput,
  ErpnextRequestOutput,
  ErpnextResult,
} from "@/lib/entities/erpnext.type";
import { loginErpnext as loginErpnextUseCase } from "../usecases/erpnext/login.usecase";
import { requestErpnext as requestErpnextUseCase } from "../usecases/erpnext/request.usecase";

export async function loginErpnext(
  input: ErpnextLoginInput,
): Promise<ErpnextResult<ErpnextLoginOutput>> {
  return loginErpnextUseCase(input);
}

export async function requestErpnext(
  input: ErpnextRequestInput,
): Promise<ErpnextResult<ErpnextRequestOutput>> {
  return requestErpnextUseCase(input);
}
