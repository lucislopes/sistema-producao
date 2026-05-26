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

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          {cancelText}
        </Button>

        <Button
          variant={variant}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}