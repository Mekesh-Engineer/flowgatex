import Swal, { SweetAlertIcon } from 'sweetalert2';

interface ToastOptions {
  title: string;
  icon?: SweetAlertIcon;
  timer?: number;
}

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#12121a',
  color: '#f8fafc',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showToast = ({ title, icon = 'success', timer = 3000 }: ToastOptions) => {
  return Toast.fire({ title, icon, timer });
};

export const showSuccess = (title: string) => showToast({ title, icon: 'success' });
export const showError = (title: string) => showToast({ title, icon: 'error' });
export const showWarning = (title: string) => showToast({ title, icon: 'warning' });
export const showInfo = (title: string) => showToast({ title, icon: 'info' });

export default Toast;
