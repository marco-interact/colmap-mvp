{{-- Modal Component --}}
@props(['id', 'title', 'size' => 'medium'])

@php
$sizeClasses = [
    'small' => 'max-width: 400px;',
    'medium' => 'max-width: 600px;',
    'large' => 'max-width: 800px;',
    'xlarge' => 'max-width: 1200px;'
];
@endphp

<div id="{{ $id }}" class="modal-overlay" style="display: none;">
    <div class="modal" style="{{ $sizeClasses[$size] }}">
        <div class="modal-header">
            <h2 class="modal-title">{{ $title }}</h2>
            <button type="button" class="modal-close" onclick="closeModal('{{ $id }}')">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="modal-body">
            {{ $slot }}
        </div>
        @isset($footer)
            <div class="modal-footer">
                {{ $footer }}
            </div>
        @endisset
    </div>
</div>

@pushOnce('scripts')
<script>
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        modal.focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Close modal on overlay click
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeModal(event.target.id);
    }
});

// Close modal on ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay[style*="flex"]');
        if (openModal) {
            closeModal(openModal.id);
        }
    }
});
</script>
@endPushOnce
