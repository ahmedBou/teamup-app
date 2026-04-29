import React, { useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

type PickerModalProps = {
  visible: boolean
  value: string
  onConfirm: (value: string) => void
  onClose: () => void
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function yearsList() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, index) => currentYear + index)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function PickerColumn({
  title,
  values,
  selectedValue,
  onSelect,
}: {
  title: string
  values: string[]
  selectedValue: string
  onSelect: (value: string) => void
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle}>{title}</Text>

      <ScrollView
        style={styles.columnScroll}
        contentContainerStyle={styles.columnContent}
        showsVerticalScrollIndicator={false}
      >
        {values.map((item) => {
          const selected = item === selectedValue

          return (
            <Pressable
              key={item}
              onPress={() => onSelect(item)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text
                style={[styles.optionText, selected && styles.optionTextSelected]}
              >
                {item}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: PickerModalProps) {
  const fallbackDate = new Date()
  fallbackDate.setDate(fallbackDate.getDate() + 1)

  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  const initialYear = parts ? parts[1] : String(fallbackDate.getFullYear())
  const initialMonth = parts ? parts[2] : pad2(fallbackDate.getMonth() + 1)
  const initialDay = parts ? parts[3] : pad2(fallbackDate.getDate())

  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [day, setDay] = useState(initialDay)

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => pad2(index + 1)),
    []
  )

  const years = useMemo(() => yearsList().map(String), [])

  const days = useMemo(() => {
    const total = daysInMonth(Number(year), Number(month))
    return Array.from({ length: total }, (_, index) => pad2(index + 1))
  }, [year, month])

  const safeDay = days.includes(day) ? day : days[days.length - 1]

  const confirmDate = () => {
    onConfirm(`${year}-${month}-${safeDay}`)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Choose a date</Text>

          <View style={styles.pickerRow}>
            <PickerColumn
              title="Day"
              values={days}
              selectedValue={safeDay}
              onSelect={setDay}
            />

            <PickerColumn
              title="Month"
              values={months}
              selectedValue={month}
              onSelect={setMonth}
            />

            <PickerColumn
              title="Year"
              values={years}
              selectedValue={year}
              onSelect={setYear}
            />
          </View>

          <Pressable onPress={confirmDate} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

export function TimePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: PickerModalProps) {
  const parts = value.match(/^(\d{2}):(\d{2})$/)

  const [hour, setHour] = useState(parts ? parts[1] : '07')
  const [minute, setMinute] = useState(parts ? parts[2] : '00')

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, index) => pad2(index)),
    []
  )

  const minutes = useMemo(
    () => Array.from({ length: 12 }, (_, index) => pad2(index * 5)),
    []
  )

  const confirmTime = () => {
    onConfirm(`${hour}:${minute}`)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Choose a time</Text>

          <View style={styles.pickerRow}>
            <PickerColumn
              title="Hour"
              values={hours}
              selectedValue={hour}
              onSelect={setHour}
            />

            <PickerColumn
              title="Minute"
              values={minutes}
              selectedValue={minute}
              onSelect={setMinute}
            />
          </View>

          <Pressable onPress={confirmTime} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },

  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    minHeight: 430,
  },

  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 22,
  },

  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },

  column: {
    flex: 1,
    alignItems: 'center',
  },

  columnTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  columnScroll: {
    height: 210,
    width: '100%',
  },

  columnContent: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },

  option: {
    minWidth: 72,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  optionSelected: {
    borderWidth: 1,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },

  optionText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94a3b8',
  },

  optionTextSelected: {
    color: '#16a34a',
    fontWeight: '900',
  },

  confirmButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#07111f',
  },
})