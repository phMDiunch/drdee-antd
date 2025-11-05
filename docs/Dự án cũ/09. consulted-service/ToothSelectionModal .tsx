import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Typography } from "antd";

const { Title } = Typography;

// Constants
export const PERMANENT_TEETH_POSITIONS = [
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",
  "R16",
  "R17",
  "R18",
  "R21",
  "R22",
  "R23",
  "R24",
  "R25",
  "R26",
  "R27",
  "R28",
  "R31",
  "R32",
  "R33",
  "R34",
  "R35",
  "R36",
  "R37",
  "R38",
  "R41",
  "R42",
  "R43",
  "R44",
  "R45",
  "R46",
  "R47",
  "R48",
];

export const MILK_TEETH_POSITIONS = [
  "R51",
  "R52",
  "R53",
  "R54",
  "R55",
  "R61",
  "R62",
  "R63",
  "R64",
  "R65",
  "R71",
  "R72",
  "R73",
  "R74",
  "R75",
  "R81",
  "R82",
  "R83",
  "R84",
  "R85",
];

const ToothButton = ({
  tooth,
  onClick,
  isSelected,
}: {
  tooth: string;
  onClick: (tooth: string) => void;
  isSelected: boolean;
}) => (
  <Button
    type={isSelected ? "primary" : "default"}
    onClick={() => onClick(tooth)}
    style={{ width: "50px", margin: "2px" }}
  >
    {tooth.replace("R", "")}
  </Button>
);

const ToothQuadrant = ({
  title,
  teeth,
  onToothClick,
  selectedTeeth,
}: {
  title: string;
  teeth: string[];
  onToothClick: (tooth: string) => void;
  selectedTeeth: string[];
}) => (
  <Col span={12} style={{ marginBottom: 16 }}>
    <Title level={5}>{title}</Title>
    <div>
      {teeth.map((tooth) => (
        <ToothButton
          key={tooth}
          tooth={tooth}
          onClick={onToothClick}
          isSelected={selectedTeeth.includes(tooth)}
        />
      ))}
    </div>
  </Col>
);

type Props = {
  visible: boolean;
  onOk: (selectedTeeth: string[]) => void;
  onCancel: () => void;
  initialSelected?: string[];
};

const ToothSelectionModal = ({
  visible,
  onOk,
  onCancel,
  initialSelected = [],
}: Props) => {
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (visible) {
      setSelectedTeeth(initialSelected);
    }
  }, [visible, initialSelected]);

  const handleToothClick = (tooth: string) => {
    setSelectedTeeth((prev) =>
      prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]
    );
  };

  const handleConfirm = () => {
    onOk(selectedTeeth);
  };

  return (
    <Modal
      open={visible}
      title="Chọn vị trí răng"
      width={600}
      onOk={handleConfirm}
      onCancel={onCancel}
    >
      <Title level={4}>Răng vĩnh viễn</Title>
      <Row>
        <ToothQuadrant
          title="Hàm trên bên phải (1)"
          teeth={PERMANENT_TEETH_POSITIONS.slice(0, 8)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
        <ToothQuadrant
          title="Hàm trên bên trái (2)"
          teeth={PERMANENT_TEETH_POSITIONS.slice(8, 16)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
        <ToothQuadrant
          title="Hàm dưới bên trái (3)"
          teeth={PERMANENT_TEETH_POSITIONS.slice(16, 24)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
        <ToothQuadrant
          title="Hàm dưới bên phải (4)"
          teeth={PERMANENT_TEETH_POSITIONS.slice(24, 32)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
      </Row>
      <Title level={4} style={{ marginTop: 16 }}>
        Răng sữa
      </Title>
      <Row>
        <ToothQuadrant
          title="Hàm trên bên phải (5)"
          teeth={MILK_TEETH_POSITIONS.slice(0, 5)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
        <ToothQuadrant
          title="Hàm trên bên trái (6)"
          teeth={MILK_TEETH_POSITIONS.slice(5, 10)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
        <ToothQuadrant
          title="Hàm dưới bên trái (7)"
          teeth={MILK_TEETH_POSITIONS.slice(10, 15)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
        <ToothQuadrant
          title="Hàm dưới bên phải (8)"
          teeth={MILK_TEETH_POSITIONS.slice(15, 20)}
          onToothClick={handleToothClick}
          selectedTeeth={selectedTeeth}
        />
      </Row>
    </Modal>
  );
};

export default ToothSelectionModal;
