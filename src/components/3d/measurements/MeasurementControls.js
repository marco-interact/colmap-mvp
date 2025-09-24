/**
 * Measurement Controls for COLMAP 3D Viewer
 * Based on https://github.com/AwesomeTeamOne/3DView.Measurements
 * Adapted for React Three Fiber and modern Three.js
 */

import * as THREE from 'three'

export class MeasurementControls extends THREE.EventDispatcher {
  constructor(camera, domElement, scene) {
    super()
    
    this.camera = camera
    this.domElement = domElement
    this.scene = scene
    
    this.enabled = true
    this.activeMeasurement = null
    this.measurements = []
    
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // Bind event handlers
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    
    this.domElement.addEventListener('mousedown', this.onMouseDown, false)
    this.domElement.addEventListener('mousemove', this.onMouseMove, false)
    this.domElement.addEventListener('mouseup', this.onMouseUp, false)
  }

  onMouseDown(event) {
    if (!this.enabled || !this.activeMeasurement) return

    event.preventDefault()
    
    this.updateMouse(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      this.activeMeasurement.addPoint(point)
      
      if (this.activeMeasurement.isComplete()) {
        this.measurements.push(this.activeMeasurement)
        this.dispatchEvent({ type: 'measurementAdded', object: this.activeMeasurement })
        this.activeMeasurement = null
      }
      
      this.dispatchEvent({ type: 'measurementChanged', object: this.activeMeasurement })
    }
  }

  onMouseMove(event) {
    if (!this.enabled || !this.activeMeasurement) return
    
    this.updateMouse(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      this.activeMeasurement.setPreviewPoint(point)
      this.dispatchEvent({ type: 'measurementChanged', object: this.activeMeasurement })
    }
  }

  onMouseUp(event) {
    // Handle mouse up events if needed
  }

  updateMouse(event) {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  addMeasurement(measurement) {
    this.activeMeasurement = measurement
    this.scene.add(measurement.getObject3D())
  }

  removeMeasurement(measurement) {
    const index = this.measurements.indexOf(measurement)
    if (index !== -1) {
      this.measurements.splice(index, 1)
      this.scene.remove(measurement.getObject3D())
      this.dispatchEvent({ type: 'measurementRemoved', object: measurement })
    }
  }

  clearMeasurements() {
    this.measurements.forEach(measurement => {
      this.scene.remove(measurement.getObject3D())
    })
    this.measurements = []
    this.activeMeasurement = null
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown)
    this.domElement.removeEventListener('mousemove', this.onMouseMove)
    this.domElement.removeEventListener('mouseup', this.onMouseUp)
  }
}
