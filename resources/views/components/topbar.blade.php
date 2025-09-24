{{-- Topbar Component --}}
@props(['title' => ''])

<div class="topbar">
    @if($title)
        <h1 class="topbar-title">{{ $title }}</h1>
    @endif
    
    <div class="topbar-actions">
        <div class="search-container">
            <div class="search-input">
                <input type="text" placeholder="Search Project" id="project-search">
                <i data-lucide="search" class="search-icon"></i>
            </div>
        </div>
        
        <button type="button" class="btn-primary" onclick="openModal('create-project-modal')">
            <i data-lucide="plus" class="icon"></i>
            NEW PROJECT
        </button>
    </div>
</div>
