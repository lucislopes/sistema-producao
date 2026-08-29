import { Modal } from "./Modal"
import { Button } from "./Button"

export function ConfirmModal({
  open,
  title = "Confirmar ação",
  message = "Deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "danger"
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width="max-w-md"
    >
      <p className="text-gray-700 mb-6">
        {message}
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          {cancelText}
        </Button>

        <Button
          variant={variant}
          onClick={onConfirm}
          className="w-full sm:w-auto"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
